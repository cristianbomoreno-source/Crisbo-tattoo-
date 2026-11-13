import type { SupabaseClient } from '@supabase/supabase-js'
import { createUtilityTemplate, fetchTemplateStatus, sendBodyTemplate, sendTextMessage } from '@/lib/whatsapp-cloud/api'
import { isServiceWindowOpen, normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import { saveOutgoing } from '@/lib/whatsapp-cloud/outbox'
import { REMINDER_LANGUAGE, citaDate, citaTime, firstName } from './confirmation'

/** Resumen de la cita fuera de la ventana de 24 h (Meta solo deja plantillas).
 * Sin botones: la confirmación de asistencia la pide el recordatorio 24 h antes. */
export const BOOKING_TEMPLATE = {
  name: 'cita_agendada_v1',
  body: 'Hola {{1}}, tu cita de tatuaje en Crisbo Tattoo quedó agendada para el {{2}} a las {{3}}. Te esperamos en {{4}}. Un día antes te escribiremos para que confirmes tu asistencia.',
  example: ['Laura', 'viernes 17 de octubre', '10:00 a. m.', 'Calle 10 # 5-20, Bogotá'],
}

type Row = {
  id: string
  studio_id: string
  scheduled_at: string
  projects: { clients: { id: string; name: string; phone: string | null } | null } | null
  studios: { name: string; address: string | null; city: string | null } | null
}

/** Envía al cliente, apenas se agenda (o se cambia de horario) la cita, el
 * mensaje con todos los datos. Dentro de la ventana de 24 h va el texto
 * completo del estudio (`message`); fuera de ella, la plantilla
 * `cita_agendada_v1` con fecha, hora y lugar. No toca la confirmación: esa
 * la pide el recordatorio del cron 24 h antes. Devuelve un error legible o null. */
export async function sendBookingDetails(admin: SupabaseClient, sessionId: string, message: string): Promise<string | null> {
  const { data } = await admin
    .from('sessions')
    .select('id, studio_id, scheduled_at, projects(clients(id, name, phone)), studios(name, address, city)')
    .eq('id', sessionId)
    .maybeSingle()
  const s = data as unknown as Row | null
  if (!s) return 'Cita no encontrada'
  const client = s.projects?.clients
  const phone = normalizeWaPhone(client?.phone ?? null)
  if (!client || !phone) return 'El cliente no tiene teléfono guardado'

  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', s.studio_id)
    .maybeSingle()
  if (!acc) return 'WhatsApp no está conectado'

  // Chat de WhatsApp del cliente (puede tener nombre de usuario en vez del número).
  const { data: convs } = await admin
    .from('wa_conversations')
    .select('wa_id, channel, last_inbound_at')
    .eq('studio_id', s.studio_id)
    .or(`client_id.eq.${client.id},wa_id.eq.${phone}`)
    .order('last_inbound_at', { ascending: false, nullsFirst: false })
  const chat = (convs ?? []).find((c) => (c.channel ?? 'whatsapp') === 'whatsapp')
  const waId = chat?.wa_id ?? phone

  try {
    if (isServiceWindowOpen(chat?.last_inbound_at)) {
      const waMessageId = await sendTextMessage(acc, waId, message)
      await saveOutgoing(admin, { studioId: s.studio_id, waId, client, waMessageId, body: message, preview: message })
      return null
    }

    let status: string
    try {
      status = (await fetchTemplateStatus(acc.waba_id, acc.access_token, BOOKING_TEMPLATE.name)).status
    } catch {
      await createUtilityTemplate(acc.waba_id, acc.access_token, {
        name: BOOKING_TEMPLATE.name,
        language: REMINDER_LANGUAGE,
        body: BOOKING_TEMPLATE.body,
        example: BOOKING_TEMPLATE.example,
      }).catch((e) => console.error('[booking-notice] no se pudo crear la plantilla', (e as Error).message))
      status = 'PENDING'
    }
    if (status !== 'APPROVED')
      return 'El cliente no ha escrito en las últimas 24 h y la plantilla de cita agendada aún está en revisión en WhatsApp'

    const place = s.studios?.address || s.studios?.city || s.studios?.name || 'nuestro estudio'
    const params = [firstName(client.name), citaDate(s.scheduled_at), citaTime(s.scheduled_at), place]
    const waMessageId = await sendBodyTemplate(acc, waId, { name: BOOKING_TEMPLATE.name, language: REMINDER_LANGUAGE, params })
    const body = params.reduce((t, p, i) => t.replace(`{{${i + 1}}}`, p), BOOKING_TEMPLATE.body)
    await saveOutgoing(admin, {
      studioId: s.studio_id,
      waId,
      client,
      waMessageId,
      body: `📅 Cita agendada\n\n${body}`,
      preview: '📅 Cita agendada',
      type: 'template',
    })
    return null
  } catch (e) {
    console.error('[booking-notice]', (e as Error).message)
    return `No se pudo enviar el WhatsApp: ${(e as Error).message}`
  }
}
