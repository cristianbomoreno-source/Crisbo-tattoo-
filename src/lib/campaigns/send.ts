import type { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, type Result } from '@/lib/errors/types'
import { loadCampaignData } from '@/queries/campaigns'
import { fetchTemplateStatus, sendImageTemplate } from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import type { CampaignGroup } from './audience'
import {
  CAMPAIGN_IMAGE_PATH,
  CAMPAIGN_LANGUAGE,
  CAMPAIGN_NAME,
  CAMPAIGN_TEMPLATES,
  campaignMessageText,
} from './nuevos-trazos'

export type CampaignSendResult = { sent: number; failed: { name: string; error: string }[] }

/** Envía el mensaje del grupo a quienes todavía no lo han recibido (ni fueron
 * quitados). Cada envío crea (o reutiliza) el chat del cliente y queda
 * guardado en él. Usa el cliente admin: lo llaman el botón y el cron. */
export async function sendCampaignGroupCore(
  admin: SupabaseClient,
  opts: { studioId: string; group: CampaignGroup; origin: string; sentBy: string | null }
): Promise<Result<CampaignSendResult>> {
  const { studioId, group } = opts
  const def = CAMPAIGN_TEMPLATES[group]

  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', studioId)
    .maybeSingle()
  if (!acc) return err('VALIDATION_ERROR', 'Primero conecta tu número en Ajustes → WhatsApp')

  try {
    const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, def.name)
    if (t.status !== 'APPROVED') {
      return err('VALIDATION_ERROR', `Meta todavía no aprueba la plantilla del ${def.label} (estado: ${t.status}).`)
    }
  } catch {
    return err('VALIDATION_ERROR', 'Primero crea las plantillas de la campaña.')
  }

  const data = await loadCampaignData(admin, { studioId, artistId: null })
  if (!data.success) return data
  const pending = data.data.recipients.filter((r) => r.group === group && !r.sentStatus && !r.excluded)

  const imageLink = `${opts.origin}${CAMPAIGN_IMAGE_PATH}`
  const failed: CampaignSendResult['failed'] = []
  let sent = 0

  async function sendOne(r: (typeof pending)[number]) {
    const waId = normalizeWaPhone(r.phone)
    if (!waId) {
      failed.push({ name: r.name, error: 'Número inválido' })
      return
    }
    try {
      const waMessageId = await sendImageTemplate(acc!, waId, {
        name: def.name,
        language: CAMPAIGN_LANGUAGE,
        imageLink,
        params: [r.firstName],
      })

      await admin
        .from('wa_conversations')
        .upsert(
          { studio_id: studioId, wa_id: waId, contact_name: r.name, client_id: r.clientId },
          { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
        )
      const { data: conv, error: convError } = await admin
        .from('wa_conversations')
        .select('id, client_id')
        .eq('studio_id', studioId)
        .eq('wa_id', waId)
        .single()
      if (convError) throw convError
      if (!conv.client_id) await admin.from('wa_conversations').update({ client_id: r.clientId }).eq('id', conv.id)

      const now = new Date().toISOString()
      await admin.from('wa_messages').insert({
        conversation_id: conv.id,
        studio_id: studioId,
        wa_message_id: waMessageId,
        direction: 'out',
        type: 'template',
        body: campaignMessageText(group, [r.firstName]),
        media_url: CAMPAIGN_IMAGE_PATH,
        status: 'sent',
        sent_by: opts.sentBy,
        created_at: now,
      })
      await admin
        .from('wa_conversations')
        .update({
          last_message_at: now,
          last_message_preview: `📣 ${CAMPAIGN_NAME}`,
          last_message_direction: 'out',
        })
        .eq('id', conv.id)
      sent++
    } catch (e) {
      failed.push({ name: r.name, error: (e as Error).message })
    }
  }

  // De a 5 en paralelo: rápido sin chocar con los límites de Meta.
  for (let i = 0; i < pending.length; i += 5) {
    await Promise.all(pending.slice(i, i + 5).map(sendOne))
  }
  return ok({ sent, failed })
}
