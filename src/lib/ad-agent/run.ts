import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToStudio } from '@/lib/push/send'
import { loadContactGroups } from '@/lib/crm/contact-groups'
import { looksAutomated } from '@/lib/whatsapp-cloud/auto-reply'
import { downloadMedia, sendLocationMessage, sendTextMessage, type WaAccountCredentials } from '@/lib/whatsapp-cloud/api'
import { messagePreview } from '@/lib/whatsapp-cloud/parse'
import { STUDIO_LOCATION, studioLocationText } from '@/lib/whatsapp-cloud/studio-location'
import { loadAgenda, type Agenda } from './agenda'
import { buildExamples, loadExampleRows, type ExampleRow } from './examples'
import { AGENT_MARK, HANDOFF_MARK, chatMode, checkReply, decide, isAdMessage, type AgentMessage, type StoredChatMode } from './guard'
import { writeReply, type AgentMedia } from './reply'
import { acquireAdAgentLock, loadAdAgentSettings, loadChatModes, releaseAdAgentLock, saveChatModes } from './store'

/**
 * Agente de la pauta: cada minuto busca chats de anuncios con mensajes sin
 * responder y contesta como Crisbo. Espera un poco tras el último mensaje para
 * leer las ráfagas juntas (texto + foto + audio). Si algo falla no envía nada y
 * el siguiente minuto lo reintenta, hasta que el chat sale de la ventana y
 * queda para Crisbo.
 */

const DEBOUNCE_MS = 40_000
const WINDOW_MS = 20 * 60_000
/** El cron tiene 60 s de vida. */
const TIME_BUDGET_MS = 45_000
const MAX_MEDIA = 4
const MAX_MEDIA_BYTES = 8 * 1024 * 1024
const BUBBLE_GAP_MS = 1200

type Admin = SupabaseClient
type Conversation = {
  id: string
  wa_id: string
  contact_name: string | null
  client_id: string | null
  lead_stage: string | null
  created_at: string
  channel: string | null
}
type Context = {
  knowledge: string
  enabledAt: string
  modes: Record<string, StoredChatMode>
  personal: Set<string>
  agenda: Agenda
  history: ExampleRow[]
}
type Row = AgentMessage & { media_id: string | null; media_mime: string | null }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function loadMedia(messages: Row[], account: WaAccountCredentials) {
  const wanted = messages.filter((m) => m.direction === 'in' && m.media_id && ['image', 'audio'].includes(m.type)).slice(-MAX_MEDIA)
  const media: AgentMedia[] = []
  for (const m of wanted) {
    try {
      const file = await downloadMedia(m.media_id!, account.access_token)
      const bytes = new Uint8Array(await new Response(file.body).arrayBuffer())
      if (bytes.length <= MAX_MEDIA_BYTES) media.push({ type: m.type, bytes, mime: (m.media_mime || file.mime).split(';')[0]!.trim() })
    } catch (e) {
      // Meta borra los archivos viejos: se sigue con el texto del chat.
      console.warn('[ad-agent] media', (e as Error).message)
    }
  }
  return media
}

async function saveOut(admin: Admin, studioId: string, conversationId: string, m: { id: string; type: string; body: string; mark: string }) {
  const now = new Date().toISOString()
  const { error } = await admin.from('wa_messages').insert({
    conversation_id: conversationId,
    studio_id: studioId,
    wa_message_id: m.id,
    direction: 'out',
    type: m.type,
    body: m.body,
    media_filename: m.mark,
    status: 'sent',
    created_at: now,
  })
  if (error) throw error
  await admin
    .from('wa_conversations')
    .update({ last_message_at: now, last_message_preview: messagePreview(m.type, m.body), last_message_direction: 'out' })
    .eq('id', conversationId)
}

async function notifyHandoff(studioId: string, conv: Conversation, reason: string) {
  await sendPushToStudio(studioId, {
    title: `Agente · ${conv.contact_name || `+${conv.wa_id}`}`,
    body: reason,
    link: `/dashboard/inbox/${conv.id}`,
  })
}

/** Devuelve el cambio de modo del chat, si hubo. */
async function handleConversation(admin: Admin, account: WaAccountCredentials, studioId: string, conv: Conversation, ctx: Context): Promise<StoredChatMode | null> {
  const stored = ctx.modes[conv.id]
  if (stored?.mode === 'human' || (ctx.personal.has(conv.id) && !stored)) return null
  const start = stored?.since ?? ctx.enabledAt
  const anyChat = chatMode(conv, stored, ctx.enabledAt) === 'ai'
  const { data } = await admin
    .from('wa_messages')
    .select('direction, type, body, media_filename, media_id, media_mime, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: false })
    .limit(60)
  const messages = ((data ?? []) as Row[]).reverse()

  const decision = decide(messages, start, anyChat)
  if (!decision.act) {
    const passed = decision.reason === 'human' || decision.reason === 'handed-off' || decision.reason === 'limit'
    if (decision.handoff) {
      const text = 'Dame un momento y ya te confirmo'
      const id = await sendTextMessage(account, conv.wa_id, text)
      await saveOut(admin, studioId, conv.id, { id, type: 'text', body: text, mark: HANDOFF_MARK })
      await notifyHandoff(studioId, conv, 'Lleva muchos mensajes con el agente sin cerrar')
    }
    return passed ? { mode: 'human', since: new Date().toISOString() } : null
  }
  if (looksAutomated(messages.at(-1)?.body)) return null

  const media = await loadMedia(messages, account)
  const lastOut = messages.findLastIndex((m) => m.direction === 'out')
  const pending = messages.slice(lastOut + 1).map((m) => m.body ?? '').join(' ')
  const reply = checkReply(
    await writeReply({
      messages,
      media,
      knowledge: ctx.knowledge,
      contactName: conv.contact_name,
      returningClient: !!conv.client_id,
      fromAd: messages.some(isAdMessage),
      agenda: ctx.agenda.text,
      examples: buildExamples(ctx.history, pending, new Set([...ctx.personal, conv.id])),
    }),
    ctx.knowledge,
    ctx.agenda.days
  )

  for (const [i, body] of reply.bubbles.entries()) {
    if (i > 0) await sleep(BUBBLE_GAP_MS)
    const last = i === reply.bubbles.length - 1
    const id = await sendTextMessage(account, conv.wa_id, body)
    await saveOut(admin, studioId, conv.id, { id, type: 'text', body, mark: last && reply.handoff ? HANDOFF_MARK : AGENT_MARK })
  }
  if (reply.location) {
    const id = await sendLocationMessage(account, conv.wa_id, STUDIO_LOCATION)
    await saveOut(admin, studioId, conv.id, { id, type: 'location', body: studioLocationText(), mark: AGENT_MARK })
  }
  // Ya tiene los datos de pago: el embudo lo muestra esperando el abono.
  if (conv.lead_stage !== 'abono' && reply.bubbles.some((b) => /\bllave\b/i.test(b))) {
    await admin.from('wa_conversations').update({ lead_stage: 'abono', lead_stage_at: new Date().toISOString() }).eq('id', conv.id)
  }
  if (reply.handoff) {
    await notifyHandoff(studioId, conv, reply.reason ?? 'Revisar este chat')
    return { mode: 'human', since: new Date().toISOString() }
  }
  return stored ? null : { mode: 'ai', since: start }
}

export async function runAdAgent(admin: Admin) {
  const started = Date.now()
  const { data: accounts } = await admin.from('whatsapp_accounts').select('studio_id, phone_number_id, access_token')

  for (const account of accounts ?? []) {
    const studioId = account.studio_id as string
    const settings = await loadAdAgentSettings(admin, studioId)
    if (!settings.enabled || !settings.enabledAt) continue
    if (!(await acquireAdAgentLock(admin, studioId))) continue

    try {
      const now = Date.now()
      const { data } = await admin
        .from('wa_conversations')
        .select('id, wa_id, contact_name, client_id, lead_stage, created_at, channel')
        .eq('studio_id', studioId)
        .neq('channel', 'instagram')
        .eq('last_message_direction', 'in')
        .gte('last_inbound_at', new Date(now - WINDOW_MS).toISOString())
        .lte('last_inbound_at', new Date(now - DEBOUNCE_MS).toISOString())
        .order('last_inbound_at', { ascending: true })
        .limit(20)

      const conversations = (data ?? []) as Conversation[]
      if (conversations.length === 0) continue
      const [groups, modes, agenda, history] = await Promise.all([
        loadContactGroups(admin, studioId),
        loadChatModes(admin, studioId),
        loadAgenda(admin, studioId),
        loadExampleRows(admin, studioId),
      ])
      const ctx: Context = { knowledge: settings.knowledge, enabledAt: settings.enabledAt, modes, personal: new Set(Object.keys(groups)), agenda, history }
      const changes: Record<string, StoredChatMode> = {}
      for (const conv of conversations) {
        if (Date.now() - started > TIME_BUDGET_MS) break
        try {
          const change = await handleConversation(admin, account as WaAccountCredentials, studioId, conv, ctx)
          if (change) changes[conv.id] = change
        } catch (e) {
          console.error('[ad-agent] chat', conv.id, (e as Error).message)
        }
      }
      await saveChatModes(admin, studioId, changes)
    } finally {
      await releaseAdAgentLock(admin, studioId)
    }
  }
}
