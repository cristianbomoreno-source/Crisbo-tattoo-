'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/errors/db'
import { ok, err, type Result } from '@/lib/errors/types'
import { getCurrentStudio } from '@/queries/studio'
import { createMarketingTemplate, listTemplates, uploadTemplateMedia } from '@/lib/whatsapp-cloud/api'
import { processDueCampaigns } from '@/lib/campaigns/custom-send'
import { loadAudience } from '@/queries/custom-campaigns'
import {
  COMODIN,
  COMODIN_BUTTONS,
  CUSTOM_FOOTER,
  CUSTOM_LANGUAGE,
  bodyFromDraft,
  countParams,
  parseTemplate,
  sanitizeParam,
  templateNameFor,
  type AudienceFilter,
  type AudienceRow,
  type TemplateInfo,
} from '@/lib/campaigns/custom'

/** Imagen de ejemplo para crear la comodín con imagen (Meta exige una). */
const SAMPLE_IMAGE = 'https://www.crisbotattoo.com/whatsapp/bono-agradecimiento.jpg'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

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

async function imageHandle(token: string, url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo leer la imagen')
  return uploadTemplateMedia(token, { bytes: await res.arrayBuffer(), mime: res.headers.get('content-type') || 'image/jpeg' })
}

/** Plantillas de la cuenta. Si faltan las comodín, las manda a revisión. */
export async function getCampaignTemplates(): Promise<Result<TemplateInfo[]>> {
  const o = await owner()
  if ('error' in o) return o.error!
  try {
    let templates = (await listTemplates(o.acc.waba_id, o.acc.access_token)).map(parseTemplate)
    const missing = Object.values(COMODIN).filter((c) => !templates.some((t) => t.name === c.name))
    if (missing.length) {
      for (const c of missing) {
        await createMarketingTemplate(o.acc.waba_id, o.acc.access_token, {
          name: c.name,
          language: CUSTOM_LANGUAGE,
          headerHandle: c.image ? await imageHandle(o.acc.access_token, SAMPLE_IMAGE) : null,
          body: c.body,
          example: [...c.example],
          footer: CUSTOM_FOOTER,
          buttons: COMODIN_BUTTONS,
        }).catch((e) => console.error(`[campaign] comodín ${c.name}`, (e as Error).message))
      }
      templates = (await listTemplates(o.acc.waba_id, o.acc.access_token)).map(parseTemplate)
    }
    return ok(templates)
  } catch (e) {
    return err('UNKNOWN_ERROR', (e as Error).message)
  }
}

/** Sube la imagen de la campaña (pública: Meta la descarga al enviar). */
export async function uploadCampaignImage(form: FormData): Promise<Result<{ url: string }>> {
  const o = await owner()
  if ('error' in o) return o.error!
  const file = form.get('file')
  if (!(file instanceof File)) return err('VALIDATION_ERROR', 'Elige una imagen')
  if (!['image/jpeg', 'image/png'].includes(file.type)) return err('VALIDATION_ERROR', 'La imagen debe ser JPG o PNG')
  if (file.size > MAX_IMAGE_BYTES) return err('VALIDATION_ERROR', 'La imagen debe pesar menos de 5 MB')
  const path = `${o.studio.id}/${Date.now().toString(36)}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const admin = createAdminClient()
  const { error } = await admin.storage.from('campaign-images').upload(path, file, { contentType: file.type })
  if (error) return err('DB_ERROR', error.message)
  return ok({ url: admin.storage.from('campaign-images').getPublicUrl(path).data.publicUrl })
}

export async function getCampaignAudience(filter: AudienceFilter): Promise<Result<AudienceRow[]>> {
  const o = await owner()
  if ('error' in o) return o.error!
  try {
    return ok(await loadAudience(await createClient(), o.studio.id, filter))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
}

export type CreateCampaignInput = {
  name: string
  mode: 'comodin' | 'existing' | 'new'
  /** comodín: el mensaje ({{2}}). */
  message?: string
  /** existing: plantilla elegida y sus variables {{2}}, {{3}}… */
  templateName?: string
  params?: string[]
  /** new: texto con {nombre}, pie y botones. */
  draft?: string
  footer?: string
  buttons?: string[]
  imageUrl?: string | null
  clientIds: string[]
  /** ISO; null = ahora. */
  scheduledAt: string | null
}

export async function createCampaign(input: CreateCampaignInput): Promise<Result<{ id: string; status: string }>> {
  const o = await owner()
  if ('error' in o) return o.error!
  const { studio, acc } = o
  const name = input.name.trim()
  if (name.length < 3) return err('VALIDATION_ERROR', 'Ponle un nombre a la campaña')
  const clientIds = [...new Set(input.clientIds)]
  if (!clientIds.length) return err('VALIDATION_ERROR', 'Elige al menos un cliente')
  if (clientIds.length > 5000) return err('VALIDATION_ERROR', 'Máximo 5.000 clientes por campaña')
  const imageUrl = input.imageUrl || null

  let templateName: string
  let body: string
  let buttons: string[]
  let params: string[] = []
  let status: 'scheduled' | 'awaiting_template' = 'scheduled'

  try {
    if (input.mode === 'new') {
      const draft = bodyFromDraft(input.draft ?? '')
      if (draft.length < 20) return err('VALIDATION_ERROR', 'Escribe el mensaje (mínimo 20 caracteres)')
      if (/^\{\{1\}\}|\{\{1\}\}$/.test(draft)) return err('VALIDATION_ERROR', 'El mensaje no puede empezar ni terminar con {nombre}')
      if (draft.length > 1000) return err('VALIDATION_ERROR', 'El mensaje es muy largo (máx. 1.000 caracteres)')
      buttons = (input.buttons ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 3)
      if (buttons.some((b) => b.length > 25)) return err('VALIDATION_ERROR', 'Cada botón puede tener máximo 25 caracteres')
      templateName = templateNameFor(name)
      body = draft
      await createMarketingTemplate(acc.waba_id, acc.access_token, {
        name: templateName,
        language: CUSTOM_LANGUAGE,
        headerHandle: imageUrl ? await imageHandle(acc.access_token, imageUrl) : null,
        body,
        example: countParams(body) ? ['Laura'] : [],
        footer: input.footer?.trim() || null,
        buttons,
      })
      status = 'awaiting_template'
    } else {
      const templates = (await listTemplates(acc.waba_id, acc.access_token)).map(parseTemplate)
      const chosen =
        input.mode === 'comodin'
          ? templates.find((t) => t.name === (imageUrl ? COMODIN.image.name : COMODIN.text.name))
          : templates.find((t) => t.name === input.templateName)
      if (!chosen) return err('VALIDATION_ERROR', 'No encontré esa plantilla en Meta')
      if (!chosen.compatible) return err('VALIDATION_ERROR', 'Esa plantilla no se puede usar desde la app')
      if (chosen.header === 'IMAGE' && !imageUrl) return err('VALIDATION_ERROR', 'Esta plantilla lleva imagen: súbela')
      if (input.mode === 'comodin') {
        const message = sanitizeParam(input.message ?? '')
        if (message.length < 10) return err('VALIDATION_ERROR', 'Escribe el mensaje de la campaña')
        params = [message]
      } else {
        params = (input.params ?? []).map(sanitizeParam)
        if (params.length < Math.max(chosen.paramCount - 1, 0) || params.some((p) => !p))
          return err('VALIDATION_ERROR', 'Llena todos los espacios de la plantilla')
      }
      templateName = chosen.name
      body = chosen.body
      buttons = chosen.buttons
      if (chosen.status !== 'APPROVED') {
        if (chosen.status === 'PENDING') status = 'awaiting_template'
        else return err('VALIDATION_ERROR', `La plantilla no está aprobada (${chosen.status})`)
      }
    }
  } catch (e) {
    return err('UNKNOWN_ERROR', `Meta: ${(e as Error).message}`)
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      studio_id: studio.id,
      name,
      template_name: templateName,
      template_language: CUSTOM_LANGUAGE,
      params,
      image_url: imageUrl,
      body_preview: body,
      buttons,
      client_ids: clientIds,
      status,
      scheduled_at: input.scheduledAt ?? new Date().toISOString(),
      created_by: auth.user?.id ?? null,
    })
    .select('id, status')
    .single()
  if (error) {
    if (error.code === '23505') return err('VALIDATION_ERROR', 'Ya tienes una campaña con ese nombre')
    return dbError(error)
  }
  // Si sale ya, la primera tanda arranca de una (el cron sigue con el resto).
  if (status === 'scheduled' && !input.scheduledAt) {
    after(() => processDueCampaigns(createAdminClient(), data.id).catch((e) => console.error('[campaign]', (e as Error).message)))
  }
  revalidatePath('/dashboard/inbox/campaigns')
  return ok(data as { id: string; status: string })
}

export async function cancelCampaign(id: string): Promise<Result<null>> {
  const o = await owner()
  if ('error' in o) return o.error!
  const { error } = await (await createClient())
    .from('campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', ['awaiting_template', 'draft', 'scheduled', 'sending'])
  if (error) return dbError(error)
  revalidatePath(`/dashboard/inbox/campaigns/c/${id}`)
  revalidatePath('/dashboard/inbox/campaigns')
  return ok(null)
}

/** Programada → sale ya. */
export async function sendCampaignNow(id: string): Promise<Result<null>> {
  const o = await owner()
  if ('error' in o) return o.error!
  const { error } = await (await createClient())
    .from('campaigns')
    .update({ scheduled_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'scheduled')
  if (error) return dbError(error)
  after(() => processDueCampaigns(createAdminClient(), id).catch((e) => console.error('[campaign]', (e as Error).message)))
  revalidatePath(`/dashboard/inbox/campaigns/c/${id}`)
  return ok(null)
}
