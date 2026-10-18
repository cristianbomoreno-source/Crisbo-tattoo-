import type { SupabaseClient } from '@supabase/supabase-js'
import type { Result } from '@/lib/errors/types'
import { loadBonoCampaignData } from '@/queries/bono-campaign'
import { sendCampaignTemplate, type CampaignSendResult } from './send'
import { BONO_IMAGE_PATH, BONO_LANGUAGE, BONO_NAME, BONO_TEMPLATE, bonoMessageText } from './bono'

/** Envío programado del bono: a todos los que faltan y NO recibieron Nuevos
 * Trazos (ni fueron quitados). Por tandas de `limit` para no pasar el tiempo
 * máximo de la función; cada corrida del cron toma los que siguen pendientes
 * (los fallidos se reintentan, a nadie le llega dos veces). */
export async function sendBonoScheduledCore(
  admin: SupabaseClient,
  opts: { studioId: string; limit: number }
): Promise<Result<CampaignSendResult & { remaining: number }>> {
  const data = await loadBonoCampaignData(admin, opts.studioId)
  if (!data.success) return data
  const pending = data.data.filter(
    (r) => !r.excluded && !r.gotNuevosTrazos && (!r.sentStatus || r.sentStatus === 'failed')
  )
  const batch = pending.slice(0, opts.limit)
  const res = await sendCampaignTemplate(admin, {
    studioId: opts.studioId,
    sentBy: null,
    recipients: batch,
    params: (r) => [r.firstName],
    template: { name: BONO_TEMPLATE.name, label: BONO_NAME, language: BONO_LANGUAGE, imagePath: BONO_IMAGE_PATH },
    chatText: bonoMessageText,
    preview: `🎁 ${BONO_NAME}`,
  })
  if (!res.success) return res
  return { ...res, data: { ...res.data, remaining: pending.length - batch.length } }
}
