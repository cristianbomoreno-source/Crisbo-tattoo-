import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchTemplateStatus, sendBodyTemplate } from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'

/**
 * Reseña en Google: al marcar una sesión como Finalizada, el cliente recibe
 * por WhatsApp un botón que abre directo la ventana "Escribir reseña" de la
 * ficha de Google Maps (CRISBO TATTOO, Cra. 58 #137a-58). La reseña va solo a
 * Google; aquí no se guarda. Una vez por cliente: el mensaje queda en su chat
 * con REVIEW_MARKER y eso evita repetirlo.
 */

/** Place ID de la ficha (sacado del ftid 0x8e3f9bed9f4a9345:0x4f45461dfc0df3c7). */
export const GOOGLE_PLACE_ID = 'ChIJRZNKn-2bP44Rx_MN_B1GRU8'
export const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`

export const REVIEW_MARKER = '⭐ Reseña en Google'
export const REVIEW_BUTTON = 'Dejar mi reseña'
export const REVIEW_TEMPLATE = {
  name: 'resena_google_v1',
  language: 'es',
  example: ['Laura'],
  body: [
    'Hola {{1}}, gracias por confiar en mí para tu tatuaje 🖤',
    '',
    'Me ayudarías muchísimo dejando tu reseña en Google, toma menos de un minuto ⭐',
  ].join('\n'),
}

export function reviewMessageText(firstName: string) {
  return [REVIEW_MARKER, '', REVIEW_TEMPLATE.body.replace('{{1}}', firstName), '', `[${REVIEW_BUTTON}]`].join('\n')
}

function firstNameOf(name: string) {
  const w = name.trim().split(/\s+/)[0] ?? ''
  return w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : 'hola'
}

/** Envía la invitación a reseñar al cliente de la sesión (si no la recibió antes). */
export async function sendGoogleReviewRequest(admin: SupabaseClient, sessionId: string) {
  const { data: s } = await admin
    .from('sessions')
    .select('studio_id, status, projects(client_id, clients(id, name, phone))')
    .eq('id', sessionId)
    .maybeSingle()
  const session = s as unknown as {
    studio_id: string | null
    status: string
    projects: { clients: { id: string; name: string; phone: string | null } | null } | null
  } | null
  const client = session?.projects?.clients
  if (!session?.studio_id || session.status !== 'completed' || !client?.phone) return
  const waId = normalizeWaPhone(client.phone)
  if (!waId) return
  const studioId = session.studio_id

  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id')
    .eq('studio_id', studioId)
    .eq('wa_id', waId)
    .maybeSingle()
  if (conv) {
    const { count } = await admin
      .from('wa_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .eq('direction', 'out')
      .like('body', `${REVIEW_MARKER}%`)
      .neq('status', 'failed')
    if (count) return
  }

  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', studioId)
    .maybeSingle()
  if (!acc) return
  const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, REVIEW_TEMPLATE.name).catch(() => null)
  if (t?.status !== 'APPROVED') {
    console.error(`[review] plantilla ${REVIEW_TEMPLATE.name}: ${t?.status ?? 'no existe'}`)
    return
  }

  const firstName = firstNameOf(client.name)
  const waMessageId = await sendBodyTemplate(acc, waId, {
    name: REVIEW_TEMPLATE.name,
    language: REVIEW_TEMPLATE.language,
    params: [firstName],
  })

  await admin
    .from('wa_conversations')
    .upsert(
      { studio_id: studioId, wa_id: waId, contact_name: client.name, client_id: client.id },
      { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
    )
  const { data: c } = await admin
    .from('wa_conversations')
    .select('id')
    .eq('studio_id', studioId)
    .eq('wa_id', waId)
    .single()
  if (!c) return
  const now = new Date().toISOString()
  await admin.from('wa_messages').insert({
    conversation_id: c.id,
    studio_id: studioId,
    wa_message_id: waMessageId,
    direction: 'out',
    type: 'template',
    body: reviewMessageText(firstName),
    status: 'sent',
    created_at: now,
  })
  await admin
    .from('wa_conversations')
    .update({ last_message_at: now, last_message_preview: REVIEW_MARKER, last_message_direction: 'out' })
    .eq('id', c.id)
  console.log(`[review] enviado a ${client.name} (+${waId})`)
}
