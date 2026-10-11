import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToStudio } from '@/lib/push/send'
import {
  messagePreview,
  normalizeWaPhone,
  shouldAdvanceStatus,
  type ParsedInbound,
  type ParsedStatus,
} from './parse'
import { formAnswersText, parseFormResponse, type FormAnswers } from './data-form'

/** Guarda en Supabase lo que llega por el webhook de Meta. Corre con el
 * cliente admin (service role): el webhook no tiene sesión de usuario. */

type Admin = SupabaseClient

/** phone_number_id → studio_id, cacheado por request (un webhook puede
 * traer varios mensajes del mismo número). */
async function studioForPhoneNumber(admin: Admin, cache: Map<string, string | null>, phoneNumberId: string) {
  if (cache.has(phoneNumberId)) return cache.get(phoneNumberId) ?? null
  const { data } = await admin
    .from('whatsapp_accounts')
    .select('studio_id')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()
  const studioId = (data?.studio_id as string | undefined) ?? null
  cache.set(phoneNumberId, studioId)
  return studioId
}

/** Busca el cliente del estudio con ese teléfono (los teléfonos se guardan
 * en formatos variados: "300 123 4567", "+57 300…", así que se normaliza). */
export async function findClientByPhone(admin: Admin, studioId: string, waId: string) {
  const { data } = await admin
    .from('clients')
    .select('id, phone')
    .eq('studio_id', studioId)
    .not('phone', 'is', null)
  const match = (data ?? []).find((c) => normalizeWaPhone(c.phone as string) === waId)
  return (match?.id as string | undefined) ?? null
}

async function getOrCreateConversation(admin: Admin, studioId: string, waId: string, contactName: string | null) {
  const { data: existing } = await admin
    .from('wa_conversations')
    .select('id, unread_count, client_id')
    .eq('studio_id', studioId)
    .eq('wa_id', waId)
    .maybeSingle()
  if (existing) return existing as { id: string; unread_count: number; client_id: string | null }

  const clientId = await findClientByPhone(admin, studioId, waId)
  // ignoreDuplicates: si Meta manda dos webhooks a la vez, el segundo no
  // revienta por la UNIQUE (studio_id, wa_id) — se relee abajo.
  await admin
    .from('wa_conversations')
    .upsert(
      { studio_id: studioId, wa_id: waId, contact_name: contactName, client_id: clientId },
      { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
    )
  const { data, error } = await admin
    .from('wa_conversations')
    .select('id, unread_count, client_id')
    .eq('studio_id', studioId)
    .eq('wa_id', waId)
    .single()
  if (error) throw error
  return data as { id: string; unread_count: number; client_id: string | null }
}

/** Vuelca el formulario de datos en la ficha del cliente: actualiza el
 * vinculado al chat, o busca por teléfono, o lo crea — y deja el chat
 * vinculado. Solo pisa campos con valor (un dato vacío no borra el que había). */
async function applyFormToClient(
  admin: Admin,
  studioId: string,
  conv: { id: string; client_id: string | null },
  waId: string,
  a: FormAnswers
) {
  const fields = {
    ...(a.nombre ? { name: a.nombre } : {}),
    ...(a.correo ? { email: a.correo } : {}),
    ...(a.nacimiento ? { birthdate: a.nacimiento } : {}),
    ...(a.celular ? { phone: a.celular } : {}),
  }

  let clientId = conv.client_id
  if (!clientId) {
    const formPhone = normalizeWaPhone(a.celular)
    clientId =
      (formPhone && formPhone !== waId ? await findClientByPhone(admin, studioId, formPhone) : null) ??
      (await findClientByPhone(admin, studioId, waId))
  }

  if (clientId) {
    if (Object.keys(fields).length) {
      await admin
        .from('clients')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', clientId)
        .eq('studio_id', studioId)
    }
  } else {
    if (!a.nombre) return
    const { data, error } = await admin
      .from('clients')
      .insert({ studio_id: studioId, artist_id: null, phone: `+${waId}`, source: 'WhatsApp (formulario)', ...fields })
      .select('id')
      .single()
    if (error) throw error
    clientId = data.id as string
  }

  if (clientId !== conv.client_id) {
    await admin.from('wa_conversations').update({ client_id: clientId }).eq('id', conv.id)
    conv.client_id = clientId
  }
}

export async function ingestInbound(admin: Admin, messages: ParsedInbound[]) {
  const cache = new Map<string, string | null>()
  // Un push por conversación, no uno por mensaje (fotos en ráfaga).
  const notify = new Map<string, { studioId: string; title: string; body: string; link: string }>()

  for (const m of messages) {
    const studioId = await studioForPhoneNumber(admin, cache, m.phoneNumberId)
    if (!studioId) continue

    const conv = await getOrCreateConversation(admin, studioId, m.waId, m.contactName)
    const answers = m.type === 'form' ? parseFormResponse(m.flowResponse) : null
    if (answers) m.body = formAnswersText(answers)

    const { error: insertError } = await admin.from('wa_messages').insert({
      conversation_id: conv.id,
      studio_id: studioId,
      wa_message_id: m.waMessageId,
      direction: 'in',
      type: m.type,
      body: m.body,
      media_id: m.mediaId,
      media_mime: m.mediaMime,
      media_filename: m.mediaFilename,
      status: 'received',
      created_at: m.timestamp,
    })
    // 23505 = Meta reintentó un webhook ya procesado: no duplicar.
    if (insertError) {
      if (insertError.code === '23505') continue
      throw insertError
    }

    if (answers) await applyFormToClient(admin, studioId, conv, m.waId, answers)

    const preview = messagePreview(m.type, m.body)
    await admin
      .from('wa_conversations')
      .update({
        last_message_at: m.timestamp,
        last_message_preview: preview,
        last_message_direction: 'in',
        last_inbound_at: m.timestamp,
        unread_count: (conv.unread_count ?? 0) + 1,
        archived: false,
        ...(m.contactName ? { contact_name: m.contactName } : {}),
      })
      .eq('id', conv.id)
    conv.unread_count = (conv.unread_count ?? 0) + 1

    notify.set(conv.id, {
      studioId,
      title: m.contactName || `+${m.waId}`,
      body: preview || 'Nuevo mensaje',
      link: `/dashboard/inbox/${conv.id}`,
    })
  }

  await Promise.all(
    [...notify.values()].map((n) => sendPushToStudio(n.studioId, { title: n.title, body: n.body, link: n.link }))
  )
}

export async function ingestStatuses(admin: Admin, statuses: ParsedStatus[]) {
  for (const s of statuses) {
    const { data } = await admin
      .from('wa_messages')
      .select('id, status')
      .eq('wa_message_id', s.waMessageId)
      .maybeSingle()
    if (!data || !shouldAdvanceStatus(data.status as string, s.status)) continue
    await admin
      .from('wa_messages')
      .update({ status: s.status, ...(s.error ? { error: s.error } : {}) })
      .eq('id', data.id)
  }
}
