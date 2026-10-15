'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/errors/db'
import { ok, err, type Result } from '@/lib/errors/types'
import { getCurrentStudio } from '@/queries/studio'
import { getCampaignRecipients } from '@/queries/campaigns'
import {
  createMarketingTemplate,
  fetchTemplateStatus,
  sendImageTemplate,
  uploadTemplateMedia,
} from '@/lib/whatsapp-cloud/api'
import { normalizeWaPhone } from '@/lib/whatsapp-cloud/parse'
import type { CampaignGroup } from '@/lib/campaigns/audience'
import {
  BUTTON_NO,
  BUTTON_YES,
  CAMPAIGN_FOOTER,
  CAMPAIGN_IMAGE_PATH,
  CAMPAIGN_KEY,
  CAMPAIGN_LANGUAGE,
  CAMPAIGN_NAME,
  CAMPAIGN_TEMPLATES,
  campaignMessageText,
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

export type CampaignSendResult = { sent: number; failed: { name: string; error: string }[] }

/** Envía el mensaje del grupo a quienes todavía no lo han recibido. Cada
 * envío crea (o reutiliza) el chat del cliente y queda guardado en él. */
export async function sendCampaignGroup(group: CampaignGroup): Promise<Result<CampaignSendResult>> {
  if (group !== 'A' && group !== 'B') return err('VALIDATION_ERROR', 'Grupo inválido')
  const owner = await ownerAccount()
  if ('error' in owner) return owner.error
  const { studio, acc } = owner
  const def = CAMPAIGN_TEMPLATES[group]

  try {
    const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, def.name)
    if (t.status !== 'APPROVED') {
      return err('VALIDATION_ERROR', `Meta todavía no aprueba la plantilla del ${def.label} (estado: ${t.status}).`)
    }
  } catch {
    return err('VALIDATION_ERROR', 'Primero crea las plantillas de la campaña.')
  }

  const recipients = await getCampaignRecipients()
  if (!recipients.success) return recipients
  const pending = recipients.data.filter((r) => r.group === group && !r.sentStatus && !r.excluded)

  const admin = createAdminClient()
  const imageLink = `${await publicOrigin()}${CAMPAIGN_IMAGE_PATH}`
  const failed: CampaignSendResult['failed'] = []
  let sent = 0

  async function sendOne(r: (typeof pending)[number]) {
    const waId = normalizeWaPhone(r.phone)
    if (!waId) {
      failed.push({ name: r.name, error: 'Número inválido' })
      return
    }
    try {
      const waMessageId = await sendImageTemplate(acc, waId, {
        name: def.name,
        language: CAMPAIGN_LANGUAGE,
        imageLink,
        params: [r.firstName],
      })

      await admin
        .from('wa_conversations')
        .upsert(
          { studio_id: studio.id, wa_id: waId, contact_name: r.name, client_id: r.clientId },
          { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
        )
      const { data: conv, error: convError } = await admin
        .from('wa_conversations')
        .select('id, client_id')
        .eq('studio_id', studio.id)
        .eq('wa_id', waId)
        .single()
      if (convError) throw convError
      if (!conv.client_id) await admin.from('wa_conversations').update({ client_id: r.clientId }).eq('id', conv.id)

      const now = new Date().toISOString()
      await admin.from('wa_messages').insert({
        conversation_id: conv.id,
        studio_id: studio.id,
        wa_message_id: waMessageId,
        direction: 'out',
        type: 'template',
        body: campaignMessageText(group, [r.firstName]),
        media_url: CAMPAIGN_IMAGE_PATH,
        status: 'sent',
        sent_by: studio.artistId,
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

  revalidatePath('/dashboard/inbox', 'layout')
  return ok({ sent, failed })
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
