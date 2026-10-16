import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchTemplateStatus, sendFlowTemplate } from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import { sendPushToStudio } from '@/lib/push/send'
import { nowAsWallClock } from '@/lib/calendar/utils'
import {
  CONSENT_FLOW_TOKEN_PREFIX,
  CONSENT_SEND_DELAY_MINUTES,
  CONSENT_TEMPLATE_LANGUAGE,
  CONSENT_TEMPLATE_NAME,
  consentSentText,
} from './whatsapp-consent'

const MIN = 60_000
/** Citas más viejas que esto no se envían (p. ej. si el cron estuvo caído). */
const MAX_LATE_MINUTES = 90
const EXPIRY_HOURS = 48

type DueSession = {
  id: string
  studio_id: string
  project_id: string | null
  scheduled_at: string
  projects: { client_id: string | null; clients: { id: string; name: string; phone: string | null } | null } | null
}

export type DueConsentsResult = { sent: number; failed: { name: string; error: string }[]; skipped: string | null }

/** Consentimiento por cita: a cada cita cuya hora pasó hace
 * CONSENT_SEND_DELAY_MINUTES (y no más de MAX_LATE_MINUTES) le crea un link
 * de consentimiento y le manda al cliente el formulario de WhatsApp. Una
 * cita nunca recibe dos (el link guarda `session_id` en `form_data`). */
export async function sendDueConsents(admin: SupabaseClient, now = new Date()): Promise<DueConsentsResult> {
  const result: DueConsentsResult = { sent: 0, failed: [], skipped: null }
  // `scheduled_at` guarda la hora de Bogotá "disfrazada" de UTC: se compara
  // contra el reloj de pared, no contra el instante real (ver nowAsWallClock).
  const wall = nowAsWallClock()
  const to = new Date(wall.getTime() - CONSENT_SEND_DELAY_MINUTES * MIN).toISOString()
  const from = new Date(wall.getTime() - MAX_LATE_MINUTES * MIN).toISOString()

  const { data, error } = await admin
    .from('sessions')
    .select('id, studio_id, project_id, scheduled_at, projects(client_id, clients(id, name, phone))')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .neq('status', 'cancelled')
  if (error) throw error
  const sessions = (data ?? []) as unknown as DueSession[]
  if (sessions.length === 0) return result

  // Citas que ya tienen su consentimiento (enviado o firmado).
  const { data: existing, error: exErr } = await admin
    .from('consent_links')
    .select('form_data')
    .in('form_data->>session_id', sessions.map((s) => s.id))
  if (exErr) throw exErr
  const done = new Set(
    ((existing ?? []) as { form_data: { session_id?: string } | null }[]).map((l) => l.form_data?.session_id)
  )
  const due = sessions.filter((s) => !done.has(s.id) && s.project_id && s.projects?.clients?.phone)
  if (due.length === 0) return result

  for (const studioId of new Set(due.map((s) => s.studio_id))) {
    const { data: acc } = await admin
      .from('whatsapp_accounts')
      .select('phone_number_id, waba_id, access_token')
      .eq('studio_id', studioId)
      .maybeSingle()
    if (!acc) continue
    try {
      const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, CONSENT_TEMPLATE_NAME)
      if (t.status !== 'APPROVED') {
        result.skipped = `Plantilla ${CONSENT_TEMPLATE_NAME}: ${t.status}`
        continue
      }
    } catch (e) {
      result.skipped = `Plantilla ${CONSENT_TEMPLATE_NAME}: ${(e as Error).message}`
      continue
    }
    const { data: studio } = await admin.from('studios').select('name').eq('id', studioId).maybeSingle()
    const studioName = (studio?.name as string | undefined) ?? 'el estudio'
    const failedBefore = result.failed.length

    for (const s of due.filter((x) => x.studio_id === studioId)) {
      const client = s.projects!.clients!
      const waId = normalizeWaPhone(client.phone)
      if (!waId) {
        result.failed.push({ name: client.name, error: 'Número inválido' })
        continue
      }

      // El link se crea ANTES de enviar: si dos crons corren a la vez, el
      // segundo ve la cita como hecha. Si el envío falla queda registrado
      // (send_error) y no se reintenta cada minuto.
      const token = randomBytes(32).toString('base64url')
      const { data: link, error: linkErr } = await admin
        .from('consent_links')
        .insert({
          studio_id: studioId,
          project_id: s.project_id,
          client_id: client.id,
          token,
          status: 'pending',
          expires_at: new Date(now.getTime() + EXPIRY_HOURS * 3_600_000).toISOString(),
          form_data: { session_id: s.id, channel: 'whatsapp' },
        })
        .select('id')
        .single()
      if (linkErr) {
        result.failed.push({ name: client.name, error: linkErr.message })
        continue
      }

      try {
        const waMessageId = await sendFlowTemplate(acc, waId, {
          name: CONSENT_TEMPLATE_NAME,
          language: CONSENT_TEMPLATE_LANGUAGE,
          flowToken: `${CONSENT_FLOW_TOKEN_PREFIX}${token}`,
        })
        await saveToChat(admin, { studioId, waId, client, waMessageId, body: consentSentText(studioName) })
        result.sent++
      } catch (e) {
        const message = (e as Error).message
        await admin
          .from('consent_links')
          .update({ form_data: { session_id: s.id, channel: 'whatsapp', send_error: message } })
          .eq('id', link.id)
        result.failed.push({ name: client.name, error: message })
      }
    }

    const failedHere = result.failed.slice(failedBefore)
    if (failedHere.length) {
      await sendPushToStudio(studioId, {
        title: '⚠️ Consentimiento no enviado',
        body: failedHere.map((f) => `${f.name}: ${f.error}`).join(' · ').slice(0, 180),
        link: '/dashboard/consents',
      })
    }
  }
  return result
}

/** Deja el mensaje enviado en el chat del cliente (lo crea si no existe). */
async function saveToChat(
  admin: SupabaseClient,
  m: { studioId: string; waId: string; client: { id: string; name: string }; waMessageId: string; body: string }
) {
  await admin
    .from('wa_conversations')
    .upsert(
      { studio_id: m.studioId, wa_id: m.waId, contact_name: m.client.name, client_id: m.client.id },
      { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
    )
  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id')
    .eq('studio_id', m.studioId)
    .eq('wa_id', m.waId)
    .single()
  if (!conv) return
  const now = new Date().toISOString()
  await admin.from('wa_messages').insert({
    conversation_id: conv.id,
    studio_id: m.studioId,
    wa_message_id: m.waMessageId,
    direction: 'out',
    type: 'template',
    body: m.body,
    status: 'sent',
    created_at: now,
  })
  await admin
    .from('wa_conversations')
    .update({ last_message_at: now, last_message_preview: '📝 Consentimiento informado', last_message_direction: 'out' })
    .eq('id', conv.id)
}
