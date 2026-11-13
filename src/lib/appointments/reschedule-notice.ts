import type { SupabaseClient } from '@supabase/supabase-js'
import { createUtilityTemplate, fetchTemplateStatus, sendBodyTemplate } from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import { saveOutgoing } from '@/lib/whatsapp-cloud/outbox'
import {
  BUTTON_CANCEL,
  BUTTON_CONFIRM,
  REMINDER_LANGUAGE,
  REMINDER_TEMPLATES,
  citaDate,
  citaTime,
  firstName,
  templateChatText,
} from './confirmation'

type Row = {
  id: string
  studio_id: string
  scheduled_at: string
  projects: { clients: { id: string; name: string; phone: string | null } | null } | null
}

/** Estado de una plantilla; si no existe en Meta, la crea (queda en revisión)
 * para que los próximos avisos salgan con su propio texto. */
async function templateApproved(acc: { waba_id: string; access_token: string }, kind: keyof typeof REMINDER_TEMPLATES) {
  const def = REMINDER_TEMPLATES[kind]
  try {
    return (await fetchTemplateStatus(acc.waba_id, acc.access_token, def.name)).status === 'APPROVED'
  } catch {
    if (kind === 'rescheduled') {
      await createUtilityTemplate(acc.waba_id, acc.access_token, {
        name: def.name,
        language: REMINDER_LANGUAGE,
        body: def.body,
        example: [...def.example],
        buttons: [BUTTON_CONFIRM, BUTTON_CANCEL],
      }).catch((e) => console.error('[reschedule-notice] no se pudo crear la plantilla', (e as Error).message))
    }
    return false
  }
}

/** Avisa al cliente por WhatsApp el nuevo horario de su cita, con los botones
 * "Confirmo mi cita" / "Cancelar cita" (los atiende reply.ts). Cuenta como el
 * recordatorio de esa cita: queda por confirmar y el segundo aviso del cron
 * sale si no responde. Devuelve un error legible si no se pudo enviar. */
export async function sendRescheduleNotice(admin: SupabaseClient, sessionId: string): Promise<string | null> {
  const { data } = await admin
    .from('sessions')
    .select('id, studio_id, scheduled_at, projects(clients(id, name, phone))')
    .eq('id', sessionId)
    .maybeSingle()
  const s = data as unknown as Row | null
  if (!s) return 'Cita no encontrada'
  const client = s.projects?.clients
  const waId = normalizeWaPhone(client?.phone ?? null)
  if (!client || !waId) return 'El cliente no tiene teléfono guardado'

  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', s.studio_id)
    .maybeSingle()
  if (!acc) return 'WhatsApp no está conectado'

  const kind = (await templateApproved(acc, 'rescheduled'))
    ? 'rescheduled'
    : (await templateApproved(acc, 'reminder'))
      ? 'reminder'
      : null
  if (!kind) return 'La plantilla de confirmación de citas no está aprobada en WhatsApp'

  const params = [firstName(client.name), citaDate(s.scheduled_at), citaTime(s.scheduled_at)]
  try {
    const waMessageId = await sendBodyTemplate(acc, waId, {
      name: REMINDER_TEMPLATES[kind].name,
      language: REMINDER_LANGUAGE,
      params,
    })
    await admin
      .from('sessions')
      .update({ reminder_sent_at: new Date().toISOString(), confirmation: 'pending', confirmation_followup_at: null })
      .eq('id', s.id)
    await saveOutgoing(admin, {
      studioId: s.studio_id,
      waId,
      client,
      waMessageId,
      body: templateChatText(kind, params),
      preview: '🔔 Cita reprogramada',
      type: 'template',
    })
    return null
  } catch (e) {
    console.error('[reschedule-notice]', (e as Error).message)
    return `No se pudo enviar el WhatsApp: ${(e as Error).message}`
  }
}
