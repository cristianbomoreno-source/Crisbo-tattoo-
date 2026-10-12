import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToStudio } from '@/lib/push/send'
import { messagePreview } from '@/lib/whatsapp-cloud/parse'
import { fetchInstagramProfile, type IgAccountCredentials } from './api'
import { loadInstagramAccountByIgUser } from './account'
import { normalizeIgUsername, type IgEvent } from './parse'

/** Guarda en Supabase lo que llega por el webhook de Instagram, en las
 * mismas tablas de la bandeja de WhatsApp (`channel = 'instagram'`). Corre
 * con el cliente admin: el webhook no tiene sesión de usuario. */

type Admin = SupabaseClient
type Account = IgAccountCredentials & { studio_id: string }
type Conv = { id: string; unread_count: number; client_id: string | null }

/** Cliente del estudio con ese @ en su ficha (clients.instagram se guarda
 * en formatos variados: "@juan", "juan", "instagram.com/juan"). */
async function findClientByInstagram(admin: Admin, studioId: string, username: string | null) {
  if (!username) return null
  const { data } = await admin
    .from('clients')
    .select('id, instagram')
    .eq('studio_id', studioId)
    .ilike('instagram', `%${username.replace(/[%_\\]/g, '\\$&')}%`)
    .limit(20)
  const match = (data ?? []).find((c) => normalizeIgUsername(c.instagram as string) === username)
  return (match?.id as string | undefined) ?? null
}

async function getOrCreateConversation(admin: Admin, account: Account, igsid: string): Promise<Conv> {
  const { data: existing } = await admin
    .from('wa_conversations')
    .select('id, unread_count, client_id, ig_username')
    .eq('studio_id', account.studio_id)
    .eq('wa_id', igsid)
    .maybeSingle()
  if (existing) {
    const conv = existing as Conv & { ig_username: string | null }
    if (!conv.client_id && conv.ig_username) {
      const clientId = await findClientByInstagram(admin, account.studio_id, conv.ig_username)
      if (clientId) {
        await admin.from('wa_conversations').update({ client_id: clientId }).eq('id', conv.id).is('client_id', null)
        conv.client_id = clientId
      }
    }
    return conv
  }

  const profile = await fetchInstagramProfile(igsid, account.access_token).catch(() => null)
  const username = normalizeIgUsername(profile?.username)
  const clientId = await findClientByInstagram(admin, account.studio_id, username)
  await admin.from('wa_conversations').upsert(
    {
      studio_id: account.studio_id,
      wa_id: igsid,
      channel: 'instagram',
      contact_name: profile?.name || (username ? `@${username}` : null),
      ig_username: username,
      client_id: clientId,
    },
    { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
  )
  const { data, error } = await admin
    .from('wa_conversations')
    .select('id, unread_count, client_id')
    .eq('studio_id', account.studio_id)
    .eq('wa_id', igsid)
    .single()
  if (error) throw error
  return data as Conv
}

export async function ingestInstagram(admin: Admin, events: IgEvent[]) {
  const accounts = new Map<string, Account | null>()
  const notify = new Map<string, { studioId: string; title: string; body: string; link: string }>()

  for (const e of events) {
    if (!accounts.has(e.igUserId)) accounts.set(e.igUserId, await loadInstagramAccountByIgUser(admin, e.igUserId))
    const account = accounts.get(e.igUserId)
    if (!account) {
      console.warn(`[instagram] Mensaje para una cuenta no conectada (${e.igUserId})`)
      continue
    }

    const conv = await getOrCreateConversation(admin, account, e.customerId)
    const { error: insertError } = await admin.from('wa_messages').insert({
      conversation_id: conv.id,
      studio_id: account.studio_id,
      wa_message_id: e.messageId,
      direction: e.echo ? 'out' : 'in',
      type: e.type,
      body: e.body,
      media_url: e.mediaUrl,
      status: e.echo ? 'sent' : 'received',
      created_at: e.timestamp,
    })
    // 23505 = reintento de Meta, o eco de un mensaje que mandamos por la API.
    if (insertError) {
      if (insertError.code === '23505') continue
      throw insertError
    }

    const preview = messagePreview(e.type === 'share' ? 'text' : e.type, e.body)
    if (e.echo) {
      // Respondido desde la app de Instagram del celular.
      await admin
        .from('wa_conversations')
        .update({
          last_message_at: e.timestamp,
          last_message_preview: preview,
          last_message_direction: 'out',
          unread_count: 0,
          answered_from_phone: true,
        })
        .eq('id', conv.id)
      continue
    }

    await admin
      .from('wa_conversations')
      .update({
        last_message_at: e.timestamp,
        last_message_preview: preview,
        last_message_direction: 'in',
        last_inbound_at: e.timestamp,
        unread_count: (conv.unread_count ?? 0) + 1,
        archived: false,
      })
      .eq('id', conv.id)
    conv.unread_count = (conv.unread_count ?? 0) + 1

    const { data: names } = await admin.from('wa_conversations').select('contact_name').eq('id', conv.id).maybeSingle()
    notify.set(conv.id, {
      studioId: account.studio_id,
      title: `Instagram · ${(names?.contact_name as string | null) || 'Nuevo mensaje'}`,
      body: preview || 'Nuevo mensaje',
      link: `/dashboard/inbox/${conv.id}`,
    })
  }

  await Promise.all(
    [...notify.values()].map((n) => sendPushToStudio(n.studioId, { title: n.title, body: n.body, link: n.link }))
  )
}
