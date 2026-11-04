'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { loadContactGroups } from '@/lib/crm/contact-groups'
import { loadAgenda } from '@/lib/ad-agent/agenda'
import { buildExamples, loadExampleRows } from '@/lib/ad-agent/examples'
import { checkReply, firstUnanswered, type AgentMessage, type CheckedReply } from '@/lib/ad-agent/guard'
import { writeReply } from '@/lib/ad-agent/reply'
import { loadAdAgentSettings, saveAdAgentSettings, saveChatModes } from '@/lib/ad-agent/store'

const schema = z.object({ enabled: z.boolean(), knowledge: z.string().trim().min(20).max(6000) })

/** Encender el agente fija `enabledAt`: solo atiende anuncios que entren desde
 * ese momento, nunca los chats que Crisbo ya venía llevando. */
export async function updateAdAgent(input: unknown): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  const parsed = schema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Escribe la información del estudio')
  try {
    const admin = createAdminClient()
    const current = await loadAdAgentSettings(admin, studio.id)
    await saveAdAgentSettings(admin, studio.id, {
      ...parsed.data,
      enabledAt: parsed.data.enabled ? (current.enabled && current.enabledAt ? current.enabledAt : new Date().toISOString()) : null,
    })
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath('/dashboard/settings/agente')
  return ok(undefined)
}

const trySchema = z.object({
  knowledge: z.string().trim().min(20).max(6000),
  messages: z.array(z.object({ direction: z.enum(['in', 'out']), body: z.string().max(2000) })).min(1).max(40),
})

/** Simulador de Ajustes: el agente contesta aquí mismo y no envía nada a nadie. */
export async function tryAdAgent(input: unknown): Promise<Result<CheckedReply>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  const parsed = trySchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Mensaje inválido')
  const { knowledge } = parsed.data
  const messages: AgentMessage[] = parsed.data.messages.map((m) => ({
    ...m,
    type: 'text',
    media_filename: null,
    created_at: new Date().toISOString(),
  }))
  try {
    const admin = createAdminClient()
    const [agenda, rows, groups] = await Promise.all([
      loadAgenda(admin, studio.id),
      loadExampleRows(admin, studio.id),
      loadContactGroups(admin, studio.id),
    ])
    const examples = buildExamples(rows, messages.at(-1)?.body ?? '', new Set(Object.keys(groups)))
    const fromAd = messages.some((m) => /cupo/i.test(m.body ?? ''))
    const reply = await writeReply({ messages, media: [], knowledge, contactName: null, returningClient: false, fromAd, agenda: agenda.text, examples })
    return ok(checkReply(reply, knowledge, agenda.days))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
}

const modeSchema = z.object({ conversationId: z.string().uuid(), mode: z.enum(['ai', 'human']) })

/** Botón IA / Yo de la bandeja. Con la IA contesta desde el próximo mensaje. */
export async function setChatMode(input: unknown): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  const parsed = modeSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Chat inválido')
  const { conversationId, mode } = parsed.data
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('wa_conversations').select('id').eq('id', conversationId).eq('studio_id', studio.id).maybeSingle()
    if (!data) return err('NOT_FOUND', 'Chat no encontrado')
    // Al pasar a la IA también contesta lo que el cliente ya tenía sin responder.
    const { data: recent } = await admin
      .from('wa_messages')
      .select('direction, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(30)
    const waiting = mode === 'ai' ? firstUnanswered((recent ?? []).reverse()) : null
    await saveChatModes(admin, studio.id, { [conversationId]: { mode, since: waiting ?? new Date().toISOString() } })
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath('/dashboard/inbox', 'layout')
  return ok(undefined)
}
