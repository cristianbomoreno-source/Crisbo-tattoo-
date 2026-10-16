import type { SupabaseClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp-cloud/api'
import { saveOutgoing } from '@/lib/whatsapp-cloud/outbox'
import { sendPushToArtist, sendPushToStudio } from '@/lib/push/send'
import { nowAsWallClock } from '@/lib/calendar/utils'
import {
  BUTTON_CANCEL,
  BUTTON_CONFIRM,
  RECOMMENDATIONS_TEXT,
  cancelledText,
  citaDate,
  citaTime,
  confirmedText,
} from './confirmation'

export function isAppointmentReply(body: string | null) {
  return body === BUTTON_CONFIRM || body === BUTTON_CANCEL
}

/** El cliente tocó "Confirmo mi cita" o "Cancelar cita": actualiza su
 * próxima cita con recordatorio y le contesta solo (dentro de la ventana de
 * 24 h que abrió su respuesta). Nunca lanza: el webhook sigue. */
export async function handleAppointmentReply(
  admin: SupabaseClient,
  m: { studioId: string; clientId: string | null; waId: string; body: string }
) {
  try {
    if (!m.clientId) return
    const confirming = m.body === BUTTON_CONFIRM
    // Confirmar: solo una cita pendiente. Cancelar: también una ya confirmada.
    const { data } = await admin
      .from('sessions')
      .select('id, artist_id, scheduled_at, confirmation, projects!inner(client_id, clients(id, name))')
      .eq('studio_id', m.studioId)
      .eq('projects.client_id', m.clientId)
      .in('status', ['scheduled', 'rescheduled'])
      .in('confirmation', confirming ? ['pending'] : ['pending', 'confirmed'])
      .gte('scheduled_at', nowAsWallClock().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
    const s = (data?.[0] ?? null) as unknown as {
      id: string
      artist_id: string | null
      scheduled_at: string
      projects: { client_id: string; clients: { id: string; name: string } | null }
    } | null
    if (!s) return
    const client = s.projects.clients ?? { id: m.clientId, name: '' }

    const stamp = new Date().toISOString()
    await admin
      .from('sessions')
      .update(
        confirming
          ? { confirmation: 'confirmed', confirmation_at: stamp }
          : { confirmation: 'cancelled', confirmation_at: stamp, status: 'cancelled' }
      )
      .eq('id', s.id)

    const { data: acc } = await admin
      .from('whatsapp_accounts')
      .select('phone_number_id, access_token')
      .eq('studio_id', m.studioId)
      .maybeSingle()
    if (acc) {
      let texts: string[]
      if (confirming) {
        const { data: studio } = await admin.from('studios').select('address, maps_url').eq('id', m.studioId).maybeSingle()
        texts = [
          confirmedText(client.name, s.scheduled_at, {
            address: (studio?.address as string | null) ?? null,
            mapsUrl: (studio?.maps_url as string | null) ?? null,
          }),
          RECOMMENDATIONS_TEXT,
        ]
      } else {
        texts = [cancelledText(client.name, s.scheduled_at)]
      }
      for (const body of texts) {
        const waMessageId = await sendTextMessage(acc, m.waId, body)
        await saveOutgoing(admin, { studioId: m.studioId, waId: m.waId, client, waMessageId, body, preview: body })
      }
    }

    const push = {
      title: confirming ? '✅ Cita confirmada' : '❌ Cita cancelada',
      body: `${client.name} ${confirming ? 'confirmó' : 'canceló'} su cita del ${citaDate(s.scheduled_at)} a las ${citaTime(s.scheduled_at)}.`,
      link: '/dashboard',
    }
    if (s.artist_id) await sendPushToArtist(s.artist_id, push)
    else await sendPushToStudio(m.studioId, push)
  } catch (e) {
    console.error('[appointments] respuesta al recordatorio falló', (e as Error).message)
  }
}
