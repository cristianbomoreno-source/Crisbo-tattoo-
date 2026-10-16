import type { SupabaseClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp-cloud/api'
import { finalizeSignedConsent } from './sign'
import { consentComplete, type ConsentFlowAnswers } from './whatsapp-consent'

export const CONSENT_THANKS_TEXT = '✅ Recibimos tu consentimiento firmado. ¡Gracias! Ya podemos empezar tu sesión.'

/** Respuesta del Flow de consentimiento (webhook): firma el link de la cita
 * con firma electrónica + la evidencia de WhatsApp, y le confirma al
 * cliente. Nunca lanza: un fallo se registra y el webhook sigue. */
export async function signConsentFromWhatsApp(
  admin: SupabaseClient,
  m: { studioId: string; conversationId: string; waId: string; waMessageId: string; timestamp: string },
  answers: ConsentFlowAnswers
) {
  try {
    if (!consentComplete(answers)) return
    const { data: link } = await admin
      .from('consent_links')
      .select('id, studio_id, project_id, client_id, template_id, status, expires_at, form_data')
      .eq('token', answers.token)
      .eq('studio_id', m.studioId)
      .maybeSingle()
    if (!link || link.status !== 'pending') return

    const res = await finalizeSignedConsent(admin, link, {
      form: {
        ...((link.form_data as Record<string, unknown> | null) ?? {}),
        ...answers.form,
        telefono: `+${m.waId}`,
        firma_electronica: {
          canal: 'WhatsApp',
          numero: `+${m.waId}`,
          nombre: answers.signerName,
          mensaje_id: m.waMessageId,
          fecha: m.timestamp,
        },
      },
      signatureData: null,
      signerIp: null,
      signerUserAgent: `WhatsApp +${m.waId}`,
    })
    if (!res.success) {
      console.error('[consent] firma por WhatsApp no guardada', res.error.message)
      return
    }

    const { data: acc } = await admin
      .from('whatsapp_accounts')
      .select('phone_number_id, access_token')
      .eq('studio_id', m.studioId)
      .maybeSingle()
    if (!acc) return
    const waMessageId = await sendTextMessage(acc, m.waId, CONSENT_THANKS_TEXT)
    const now = new Date().toISOString()
    await admin.from('wa_messages').insert({
      conversation_id: m.conversationId,
      studio_id: m.studioId,
      wa_message_id: waMessageId,
      direction: 'out',
      type: 'text',
      body: CONSENT_THANKS_TEXT,
      status: 'sent',
      created_at: now,
    })
    await admin
      .from('wa_conversations')
      .update({ last_message_at: now, last_message_preview: CONSENT_THANKS_TEXT.slice(0, 120), last_message_direction: 'out' })
      .eq('id', m.conversationId)
  } catch (e) {
    console.error('[consent] firma por WhatsApp falló', (e as Error).message)
  }
}
