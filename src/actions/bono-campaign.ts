'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/errors/db'
import { ok, err, type Result } from '@/lib/errors/types'
import { getCurrentStudio } from '@/queries/studio'
import { loadBonoCampaignData } from '@/queries/bono-campaign'
import { sendCampaignTemplate, type CampaignSendResult } from '@/lib/campaigns/send'
import { createMarketingTemplate, fetchTemplateStatus, uploadTemplateMedia } from '@/lib/whatsapp-cloud/api'
import {
  BONO_FOOTER,
  BONO_IMAGE_PATH,
  BONO_KEY,
  BONO_LANGUAGE,
  BONO_NAME,
  BONO_TEMPLATE,
  bonoMessageText,
} from '@/lib/campaigns/bono'

const PUBLIC_ORIGIN = 'https://www.crisbotattoo.com'

export type BonoTemplateStatus = { name: string; status: string; reason: string | null }

async function owner() {
  const studio = await getCurrentStudio()
  if (!studio) return { error: err('AUTH_ERROR', 'No autenticado') } as const
  if (studio.role !== 'owner') return { error: err('FORBIDDEN', 'Solo el dueño del estudio puede manejar campañas') } as const
  const { data: acc } = await createAdminClient()
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', studio.id)
    .maybeSingle()
  if (!acc) return { error: err('VALIDATION_ERROR', 'Primero conecta tu número en Ajustes → WhatsApp') } as const
  return { studio, acc: acc as { phone_number_id: string; waba_id: string; access_token: string } } as const
}

async function readStatus(wabaId: string, token: string, fresh = false): Promise<BonoTemplateStatus> {
  try {
    const t = await fetchTemplateStatus(wabaId, token, BONO_TEMPLATE.name, { fresh })
    return { name: BONO_TEMPLATE.name, status: t.status, reason: t.reason }
  } catch {
    return { name: BONO_TEMPLATE.name, status: 'MISSING', reason: null }
  }
}

/** Estado de la plantilla del bono en Meta (MISSING = sin crear).
 * fresh: el botón "Actualizar" salta la caché. */
export async function getBonoTemplateStatus(fresh = false): Promise<Result<BonoTemplateStatus>> {
  const o = await owner()
  if ('error' in o) return o.error!
  return ok(await readStatus(o.acc.waba_id, o.acc.access_token, fresh === true))
}

/** Crea la plantilla en Meta (imagen + texto + pie, sin botones). */
export async function setupBonoTemplate(): Promise<Result<BonoTemplateStatus>> {
  const o = await owner()
  if ('error' in o) return o.error!
  const { acc } = o
  const current = await readStatus(acc.waba_id, acc.access_token)
  if (current.status !== 'MISSING') return ok(current)

  let handle: string
  try {
    const res = await fetch(`${PUBLIC_ORIGIN}${BONO_IMAGE_PATH}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`no se pudo leer la imagen (${res.status})`)
    handle = await uploadTemplateMedia(acc.access_token, {
      bytes: await res.arrayBuffer(),
      mime: res.headers.get('content-type') ?? 'image/jpeg',
    })
  } catch (e) {
    return err('UNKNOWN_ERROR', `Meta no recibió la imagen: ${(e as Error).message}`)
  }
  try {
    await createMarketingTemplate(acc.waba_id, acc.access_token, {
      name: BONO_TEMPLATE.name,
      language: BONO_LANGUAGE,
      headerHandle: handle,
      body: BONO_TEMPLATE.body,
      example: BONO_TEMPLATE.example,
      footer: BONO_FOOTER,
      buttons: [],
    })
  } catch (e) {
    return err('UNKNOWN_ERROR', `Meta no aceptó la plantilla: ${(e as Error).message}`)
  }
  revalidatePath('/dashboard/inbox/campaigns/bono/clientes')
  return ok(await readStatus(acc.waba_id, acc.access_token))
}

/** "Enviar a seleccionados": nunca a quitados ni a quien ya le llegó el
 * bono (sí reintenta los fallidos). */
export async function sendBonoTo(clientIds: string[]): Promise<Result<CampaignSendResult>> {
  if (!Array.isArray(clientIds) || clientIds.length === 0) return err('VALIDATION_ERROR', 'Elige al menos un cliente')
  if (clientIds.length > 2500) return err('VALIDATION_ERROR', 'Demasiados clientes en un solo envío')
  const o = await owner()
  if ('error' in o) return o.error!
  const admin = createAdminClient()
  const data = await loadBonoCampaignData(admin, o.studio.id)
  if (!data.success) return data
  const ids = new Set(clientIds)
  const chosen = data.data.filter(
    (r) => ids.has(r.clientId) && !r.excluded && (!r.sentStatus || r.sentStatus === 'failed')
  )
  const res = await sendCampaignTemplate(admin, {
    studioId: o.studio.id,
    sentBy: o.studio.artistId,
    recipients: chosen,
    params: (r) => [r.firstName],
    template: { name: BONO_TEMPLATE.name, label: BONO_NAME, language: BONO_LANGUAGE, imagePath: BONO_IMAGE_PATH },
    chatText: bonoMessageText,
    preview: `🎁 ${BONO_NAME}`,
  })
  revalidatePath('/dashboard/inbox', 'layout')
  return res
}

/** Quita (o devuelve) a un cliente de esta campaña. */
export async function setBonoExcluded(clientId: string, excluded: boolean): Promise<Result<null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede editar la lista')
  const supabase = await createClient()
  const { error } = excluded
    ? await supabase
        .from('campaign_exclusions')
        .upsert({ studio_id: studio.id, campaign: BONO_KEY, client_id: clientId },
          { onConflict: 'studio_id,campaign,client_id', ignoreDuplicates: true })
    : await supabase
        .from('campaign_exclusions')
        .delete()
        .eq('studio_id', studio.id)
        .eq('campaign', BONO_KEY)
        .eq('client_id', clientId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox/campaigns/bono/clientes')
  return ok(null)
}
