'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/errors/db'
import { ok, err, type Result } from '@/lib/errors/types'
import { getCurrentStudio } from '@/queries/studio'
import { sendCampaignGroupCore, sendCampaignToCore, type CampaignSendResult } from '@/lib/campaigns/send'
import {
  createMarketingTemplate,
  fetchTemplateStatus,
  uploadTemplateMedia,
} from '@/lib/whatsapp-cloud/api'
import type { CampaignGroup } from '@/lib/campaigns/audience'
import {
  BUTTON_NO,
  BUTTON_YES,
  CAMPAIGN_FOOTER,
  CAMPAIGN_IMAGE_PATH,
  CAMPAIGN_KEY,
  CAMPAIGN_LANGUAGE,
  CAMPAIGN_NAME,
  CAMPAIGN_SLOTS,
  CAMPAIGN_TEMPLATES,
  type CampaignTemplateKey,
} from '@/lib/campaigns/nuevos-trazos'

export type CampaignTemplateStatus = { key: CampaignTemplateKey; name: string; status: string; reason: string | null }

type Owner =
  | { error: Result<never> }
  | { studio: NonNullable<Awaited<ReturnType<typeof getCurrentStudio>>>; acc: { phone_number_id: string; waba_id: string; access_token: string } }

async function ownerAccount(): Promise<Owner> {
  const studio = await getCurrentStudio()
  if (!studio) return { error: err('AUTH_ERROR', 'No autenticado') }
  if (studio.role !== 'owner') return { error: err('FORBIDDEN', 'Solo el dueño del estudio puede manejar campañas') }
  const { data: acc } = await createAdminClient()
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', studio.id)
    .maybeSingle()
  if (!acc) return { error: err('VALIDATION_ERROR', 'Primero conecta tu número en Ajustes → WhatsApp') }
  return { studio, acc: acc as { phone_number_id: string; waba_id: string; access_token: string } }
}

/** Dominio público para que Meta descargue la imagen (en local, producción). */
async function publicOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host || /^(localhost|127\.0\.0\.1)(:|$)/.test(host)) return 'https://www.crisbotattoo.com'
  return `https://${host}`
}

async function readStatuses(wabaId: string, token: string): Promise<CampaignTemplateStatus[]> {
  return Promise.all(
    (Object.keys(CAMPAIGN_TEMPLATES) as CampaignTemplateKey[]).map(async (key) => {
      const name = CAMPAIGN_TEMPLATES[key].name
      try {
        const t = await fetchTemplateStatus(wabaId, token, name)
        return { key, name, status: t.status, reason: t.reason }
      } catch {
        return { key, name, status: 'MISSING', reason: null }
      }
    })
  )
}

/** Estado de las 3 plantillas en Meta (MISSING = todavía no se ha creado). */
export async function getCampaignTemplateStatuses(): Promise<Result<CampaignTemplateStatus[]>> {
  const owner = await ownerAccount()
  if ('error' in owner) return owner.error
  return ok(await readStatuses(owner.acc.waba_id, owner.acc.access_token))
}

/** Crea en Meta las plantillas que faltan (imagen + texto + pie + botones). */
export async function setupCampaignTemplates(): Promise<Result<CampaignTemplateStatus[]>> {
  const owner = await ownerAccount()
  if ('error' in owner) return owner.error
  const { acc } = owner

  const current = await readStatuses(acc.waba_id, acc.access_token)
  const missing = current.filter((t) => t.status === 'MISSING')
  if (missing.length === 0) return ok(current)

  let handle: string
  try {
    const res = await fetch(`${await publicOrigin()}${CAMPAIGN_IMAGE_PATH}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`no se pudo leer la imagen (${res.status})`)
    handle = await uploadTemplateMedia(acc.access_token, { bytes: await res.arrayBuffer(), mime: 'image/jpeg' })
  } catch (e) {
    return err('UNKNOWN_ERROR', `Meta no recibió la imagen de la campaña: ${(e as Error).message}`)
  }

  const problems: string[] = []
  for (const t of missing) {
    const def = CAMPAIGN_TEMPLATES[t.key]
    try {
      await createMarketingTemplate(acc.waba_id, acc.access_token, {
        name: def.name,
        language: CAMPAIGN_LANGUAGE,
        headerHandle: handle,
        body: def.body,
        example: def.example,
        footer: CAMPAIGN_FOOTER,
        buttons: [BUTTON_YES, BUTTON_NO],
      })
    } catch (e) {
      problems.push(`${def.label}: ${(e as Error).message}`)
    }
  }
  if (problems.length) return err('UNKNOWN_ERROR', `Meta no aceptó: ${problems.join(' · ')}`)

  revalidatePath('/dashboard/inbox/campaigns')
  return ok(await readStatuses(acc.waba_id, acc.access_token))
}

export type { CampaignSendResult } from '@/lib/campaigns/send'

/** Botón "Enviar Grupo A/B" (el cron usa el mismo núcleo). */
export async function sendCampaignGroup(group: CampaignGroup): Promise<Result<CampaignSendResult>> {
  if (group !== 'A' && group !== 'B') return err('VALIDATION_ERROR', 'Grupo inválido')
  const owner = await ownerAccount()
  if ('error' in owner) return owner.error
  const res = await sendCampaignGroupCore(createAdminClient(), {
    studioId: owner.studio.id,
    group,
    origin: await publicOrigin(),
    sentBy: owner.studio.artistId,
  })
  revalidatePath('/dashboard/inbox', 'layout')
  return res
}

/** "Enviar a seleccionados": solo a los clientes que el dueño marcó. */
export async function sendCampaignToClients(clientIds: string[]): Promise<Result<CampaignSendResult>> {
  if (!Array.isArray(clientIds) || clientIds.length === 0) return err('VALIDATION_ERROR', 'Elige al menos un cliente')
  if (clientIds.length > 500) return err('VALIDATION_ERROR', 'Máximo 500 por envío')
  const owner = await ownerAccount()
  if ('error' in owner) return owner.error
  const res = await sendCampaignToCore(createAdminClient(), {
    studioId: owner.studio.id,
    clientIds: clientIds.filter((id) => typeof id === 'string'),
    origin: await publicOrigin(),
    sentBy: owner.studio.artistId,
  })
  revalidatePath('/dashboard/inbox', 'layout')
  return res
}

/** Agrega (o saca) un contacto a la lista de la campaña aunque no esté en
 * los grupos A/B por fecha. */
export async function setCampaignAdded(clientId: string, added: boolean): Promise<Result<null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede editar la lista')
  const supabase = await createClient()
  const { error } = added
    ? await supabase
        .from('campaign_extra_recipients')
        .upsert({ studio_id: studio.id, campaign: CAMPAIGN_KEY, client_id: clientId },
          { onConflict: 'studio_id,campaign,client_id', ignoreDuplicates: true })
    : await supabase
        .from('campaign_extra_recipients')
        .delete()
        .eq('studio_id', studio.id)
        .eq('campaign', CAMPAIGN_KEY)
        .eq('client_id', clientId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox/campaigns')
  return ok(null)
}

/** Quita (o devuelve) a un cliente de la lista de la campaña. */
export async function setCampaignExcluded(clientId: string, excluded: boolean): Promise<Result<null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede editar la lista')
  const supabase = await createClient()
  const { error } = excluded
    ? await supabase
        .from('campaign_exclusions')
        .upsert({ studio_id: studio.id, campaign: CAMPAIGN_KEY, client_id: clientId },
          { onConflict: 'studio_id,campaign,client_id', ignoreDuplicates: true })
    : await supabase
        .from('campaign_exclusions')
        .delete()
        .eq('studio_id', studio.id)
        .eq('campaign', CAMPAIGN_KEY)
        .eq('client_id', clientId)
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return err('DB_ERROR', 'Falta crear la tabla campaign_exclusions en Supabase (campaign-exclusions.sql)')
    }
    return dbError(error)
  }
  revalidatePath('/dashboard/inbox/campaigns')
  return ok(null)
}

/** Marca (o desmarca) que el cliente pagó el abono y tomó un cupo. Los cupos
 * son reales: no deja pasar de CAMPAIGN_SLOTS. */
export async function setCampaignSlot(clientId: string, taken: boolean): Promise<Result<{ slotsTaken: number }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede marcar cupos')
  const supabase = await createClient()

  const countSlots = async () => {
    const { count } = await supabase
      .from('campaign_slots')
      .select('client_id', { count: 'exact', head: true })
      .eq('campaign', CAMPAIGN_KEY)
    return count ?? 0
  }

  if (taken) {
    if ((await countSlots()) >= CAMPAIGN_SLOTS) {
      return err('VALIDATION_ERROR', `Ya se tomaron los ${CAMPAIGN_SLOTS} cupos de ${CAMPAIGN_NAME}`)
    }
    const { error } = await supabase
      .from('campaign_slots')
      .upsert(
        { studio_id: studio.id, campaign: CAMPAIGN_KEY, client_id: clientId },
        { onConflict: 'studio_id,campaign,client_id', ignoreDuplicates: true }
      )
    if (error) return dbError(error)
  } else {
    const { error } = await supabase
      .from('campaign_slots')
      .delete()
      .eq('studio_id', studio.id)
      .eq('campaign', CAMPAIGN_KEY)
      .eq('client_id', clientId)
    if (error) return dbError(error)
  }

  revalidatePath('/dashboard/inbox', 'layout')
  return ok({ slotsTaken: await countSlots() })
}
