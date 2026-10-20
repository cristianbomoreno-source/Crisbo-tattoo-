import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchTemplateStatus } from '@/lib/whatsapp-cloud/api'
import { sendPushToStudio } from '@/lib/push/send'
import { firstName } from './audience'
import { sendCampaignTemplate } from './send'
import { countParams, customMarker, customMessageText, type CampaignStatus } from './custom'

/** Tanda por corrida: ~250 envíos caben holgados en los 300 s de la función. */
const BATCH = 250
const LOCK_MS = 5 * 60_000

export type CampaignRow = {
  id: string
  studio_id: string
  name: string
  template_name: string
  template_language: string
  params: string[]
  image_url: string | null
  body_preview: string
  buttons: string[]
  client_ids: string[]
  status: CampaignStatus
  scheduled_at: string | null
  cursor: number
  sent_count: number
  failed_count: number
}

const campaignLink = (id: string) => `/dashboard/inbox/campaigns/c/${id}`

/** Lo llama el cron cada 5 minutos (y "Enviar ahora"): revisa plantillas en
 * revisión y envía la siguiente tanda de cada campaña que ya toca. */
export async function processDueCampaigns(admin: SupabaseClient, onlyId?: string) {
  await checkAwaitingTemplates(admin, onlyId)

  let q = admin
    .from('campaigns')
    .select('id')
    .in('status', ['scheduled', 'sending'])
    .lte('scheduled_at', new Date().toISOString())
  if (onlyId) q = q.eq('id', onlyId)
  const { data: due } = await q
  for (const { id } of (due ?? []) as { id: string }[]) {
    try {
      await sendNextBatch(admin, id)
    } catch (e) {
      console.error(`[campaign] ${id}: ${(e as Error).message}`)
      await admin.from('campaigns').update({ locked_until: null }).eq('id', id)
    }
  }
}

async function accountFor(admin: SupabaseClient, studioId: string) {
  const { data } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, access_token')
    .eq('studio_id', studioId)
    .maybeSingle()
  return data as { phone_number_id: string; waba_id: string; access_token: string } | null
}

/** Plantillas nuevas: cuando Meta responde, la campaña sigue o se cancela, con aviso. */
async function checkAwaitingTemplates(admin: SupabaseClient, onlyId?: string) {
  let q = admin.from('campaigns').select('id, studio_id, name, template_name, scheduled_at').eq('status', 'awaiting_template')
  if (onlyId) q = q.eq('id', onlyId)
  const { data } = await q
  for (const c of (data ?? []) as Pick<CampaignRow, 'id' | 'studio_id' | 'name' | 'template_name' | 'scheduled_at'>[]) {
    const acc = await accountFor(admin, c.studio_id)
    if (!acc) continue
    const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, c.template_name, { fresh: true }).catch(() => null)
    if (!t) continue
    if (t.status === 'APPROVED') {
      const when = c.scheduled_at && new Date(c.scheduled_at) > new Date() ? c.scheduled_at : new Date().toISOString()
      await admin.from('campaigns').update({ status: 'scheduled', scheduled_at: when }).eq('id', c.id)
      await sendPushToStudio(c.studio_id, {
        title: `✅ Meta aprobó la plantilla de “${c.name}”`,
        body:
          when > new Date(Date.now() + 60_000).toISOString()
            ? `La campaña sale el ${new Date(when).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })}`
            : 'La campaña empieza a enviarse ya',
        link: campaignLink(c.id),
      })
    } else if (t.status === 'REJECTED' || t.status === 'DISABLED') {
      await admin.from('campaigns').update({ status: 'cancelled' }).eq('id', c.id)
      await sendPushToStudio(c.studio_id, {
        title: `⚠️ Meta rechazó la plantilla de “${c.name}”`,
        body: t.reason ? `Motivo: ${t.reason}. Cambia el texto y créala de nuevo.` : 'Cambia el texto y créala de nuevo.',
        link: campaignLink(c.id),
      })
    }
  }
}

async function sendNextBatch(admin: SupabaseClient, id: string) {
  // Candado: dos corridas a la vez nunca toman la misma tanda.
  const now = new Date()
  const { data: locked } = await admin
    .from('campaigns')
    .update({ locked_until: new Date(now.getTime() + LOCK_MS).toISOString(), status: 'sending' })
    .eq('id', id)
    .in('status', ['scheduled', 'sending'])
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select('*')
    .maybeSingle()
  const c = locked as CampaignRow | null
  if (!c) return

  const slice = c.client_ids.slice(c.cursor, c.cursor + BATCH)
  const { data: clients } = slice.length
    ? await admin.from('clients').select('id, name, phone').in('id', slice)
    : { data: [] }
  const byId = new Map(((clients ?? []) as { id: string; name: string; phone: string | null }[]).map((x) => [x.id, x]))
  // Mismo orden de la lista; los borrados o sin teléfono se saltan.
  const recipients = slice
    .map((cid) => byId.get(cid))
    .filter((x): x is { id: string; name: string; phone: string } => !!x?.phone)
    .map((x) => ({ clientId: x.id, name: x.name, phone: x.phone, firstName: firstName(x.name) }))

  const paramCount = countParams(c.body_preview)
  const res = recipients.length
    ? await sendCampaignTemplate(admin, {
        studioId: c.studio_id,
        sentBy: null,
        recipients,
        params: (r) => (paramCount ? [r.firstName, ...c.params].slice(0, paramCount) : []),
        template: { name: c.template_name, label: c.name, language: c.template_language, imagePath: c.image_url },
        chatText: (params) => customMessageText({ name: c.name, body: c.body_preview, buttons: c.buttons }, params),
        preview: customMarker(c.name),
      })
    : { success: true as const, data: { sent: 0, failed: [] } }

  if (!res.success) {
    // La plantilla dejó de estar aprobada, sin cuenta, etc.: se pausa y avisa.
    await admin.from('campaigns').update({ status: 'scheduled', locked_until: null, scheduled_at: new Date(Date.now() + 30 * 60_000).toISOString() }).eq('id', id)
    await sendPushToStudio(c.studio_id, { title: `⚠️ “${c.name}” no se pudo enviar`, body: res.error.message, link: campaignLink(id) })
    return
  }

  const cursor = c.cursor + slice.length
  const done = cursor >= c.client_ids.length
  const sent = c.sent_count + res.data.sent
  const failed = c.failed_count + res.data.failed.length + (slice.length - recipients.length)
  await admin
    .from('campaigns')
    .update({
      cursor,
      sent_count: sent,
      failed_count: failed,
      locked_until: null,
      status: done ? 'sent' : 'sending',
      ...(done ? { sent_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)
  console.log(`[campaign] ${c.name}: +${res.data.sent} enviados, ${res.data.failed.length} fallidos (${cursor}/${c.client_ids.length})`)

  if (done) {
    await sendPushToStudio(c.studio_id, {
      title: `📣 “${c.name}” enviada`,
      body: `${sent} mensajes enviados${failed ? ` · ${failed} no se enviaron` : ''}`,
      link: campaignLink(id),
    })
  }
}
