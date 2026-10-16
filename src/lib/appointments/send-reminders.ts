import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchTemplateStatus, sendBodyTemplate, type WaAccountCredentials } from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import { saveOutgoing } from '@/lib/whatsapp-cloud/outbox'
import { nowAsWallClock } from '@/lib/calendar/utils'
import {
  REMINDER_LANGUAGE,
  REMINDER_TEMPLATES,
  citaDate,
  citaTime,
  firstName,
  templateChatText,
} from './confirmation'

const HOUR = 3_600_000
/** No se escribe a clientes de noche: lo pendiente sale a las 8:00. */
const QUIET_FROM = 21
const QUIET_UNTIL = 8

type Row = {
  id: string
  studio_id: string
  scheduled_at: string
  projects: { clients: { id: string; name: string; phone: string | null } | null } | null
}

export type RemindersResult = { reminders: number; followups: number; failed: { name: string; error: string }[]; skipped: string[] }

/** Recordatorio 24 h antes (o al agendar, si faltan menos de 24 h) y
 * segundo aviso a las 12 h si sigue sin respuesta. Idempotente:
 * `reminder_sent_at` / `confirmation_followup_at` marcan lo enviado. */
export async function sendDueReminders(admin: SupabaseClient, now = new Date()): Promise<RemindersResult> {
  const result: RemindersResult = { reminders: 0, followups: 0, failed: [], skipped: [] }
  const wall = nowAsWallClock()
  const hour = wall.getUTCHours()
  if (hour >= QUIET_FROM || hour < QUIET_UNTIL) return result
  const at = (h: number) => new Date(wall.getTime() + h * HOUR).toISOString()
  const select = 'id, studio_id, scheduled_at, projects(clients(id, name, phone))'

  // 1) Recordatorio: citas entre 3 h y 24 h desde ahora, sin recordatorio,
  //    agendadas hace más de 2 h (si acaban de agendar ya recibieron la
  //    confirmación de la reserva).
  const { data: due, error } = await admin
    .from('sessions')
    .select(select)
    .in('status', ['scheduled', 'rescheduled'])
    .is('reminder_sent_at', null)
    .gt('scheduled_at', at(3))
    .lte('scheduled_at', at(24))
    .lte('created_at', new Date(now.getTime() - 2 * HOUR).toISOString())
  if (error) throw error

  // 2) Segundo aviso: sin respuesta, faltan 12 h o menos (y más de 2 h), y
  //    el recordatorio salió hace más de 4 h.
  const { data: follow, error: fErr } = await admin
    .from('sessions')
    .select(select)
    .in('status', ['scheduled', 'rescheduled'])
    .eq('confirmation', 'pending')
    .is('confirmation_followup_at', null)
    .gt('scheduled_at', at(2))
    .lte('scheduled_at', at(12))
    .lte('reminder_sent_at', new Date(now.getTime() - 4 * HOUR).toISOString())
  if (fErr) throw fErr

  const jobs = [
    ...((due ?? []) as unknown as Row[]).map((s) => ({ s, kind: 'reminder' as const })),
    ...((follow ?? []) as unknown as Row[]).map((s) => ({ s, kind: 'followup' as const })),
  ]
  if (jobs.length === 0) return result

  const accounts = new Map<string, (WaAccountCredentials & { waba_id: string }) | null>()
  const approved = new Map<string, boolean>()

  for (const { s, kind } of jobs) {
    const client = s.projects?.clients
    const waId = normalizeWaPhone(client?.phone ?? null)
    if (!client || !waId) continue

    if (!accounts.has(s.studio_id)) {
      const { data } = await admin
        .from('whatsapp_accounts')
        .select('phone_number_id, waba_id, access_token')
        .eq('studio_id', s.studio_id)
        .maybeSingle()
      accounts.set(s.studio_id, data)
    }
    const acc = accounts.get(s.studio_id)
    if (!acc) continue

    const def = REMINDER_TEMPLATES[kind]
    const key = `${s.studio_id}:${def.name}`
    if (!approved.has(key)) {
      try {
        const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, def.name)
        approved.set(key, t.status === 'APPROVED')
        if (t.status !== 'APPROVED') result.skipped.push(`${def.name}: ${t.status}`)
      } catch (e) {
        approved.set(key, false)
        result.skipped.push(`${def.name}: ${(e as Error).message}`)
      }
    }
    if (!approved.get(key)) continue

    // Marcar ANTES de enviar: si dos crons se cruzan, solo uno envía.
    const stamp = new Date().toISOString()
    const { data: claimed } = await admin
      .from('sessions')
      .update(kind === 'reminder' ? { reminder_sent_at: stamp, confirmation: 'pending' } : { confirmation_followup_at: stamp })
      .eq('id', s.id)
      .is(kind === 'reminder' ? 'reminder_sent_at' : 'confirmation_followup_at', null)
      .select('id')
    if (!claimed?.length) continue

    const params = [firstName(client.name), citaDate(s.scheduled_at), citaTime(s.scheduled_at)]
    try {
      const waMessageId = await sendBodyTemplate(acc, waId, { name: def.name, language: REMINDER_LANGUAGE, params })
      await saveOutgoing(admin, {
        studioId: s.studio_id,
        waId,
        client,
        waMessageId,
        body: templateChatText(kind, params),
        preview: kind === 'reminder' ? '🔔 Recordatorio de cita' : '🔔 Cita por confirmar',
        type: 'template',
      })
      if (kind === 'reminder') result.reminders++
      else result.followups++
    } catch (e) {
      result.failed.push({ name: client.name, error: (e as Error).message })
    }
  }
  return result
}
