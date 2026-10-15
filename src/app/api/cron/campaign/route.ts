import { after, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignGroupCore } from '@/lib/campaigns/send'
import { CAMPAIGN_GROUPS } from '@/lib/campaigns/audience'
import { CAMPAIGN_NAME } from '@/lib/campaigns/nuevos-trazos'
import { sendPushToStudio } from '@/lib/push/send'

/** Envío programado de la campaña. Lo llama pg_cron (Supabase) a la hora
 * exacta con `Authorization: Bearer CRON_SECRET` y { studioId, group }.
 * Responde al instante y envía en segundo plano (pg_net no espera tanto). */
export const maxDuration = 300

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!secret || !got || got.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret))
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { studioId?: string; group?: string }
  const { studioId, group } = body
  if (!studioId || (group !== 'A' && group !== 'B')) {
    return NextResponse.json({ error: 'studioId y group (A|B) son obligatorios' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  after(async () => {
    const label = CAMPAIGN_GROUPS[group].label
    const res = await sendCampaignGroupCore(createAdminClient(), { studioId, group, origin, sentBy: null })
    if (!res.success) {
      console.error(`[campaign] ${label}: ${res.error.message}`)
      await sendPushToStudio(studioId, {
        title: `⚠️ ${CAMPAIGN_NAME}: no se envió el ${label}`,
        body: res.error.message,
        link: '/dashboard/inbox/campaigns',
      })
      return
    }
    const { sent, failed } = res.data
    console.log(`[campaign] ${label}: ${sent} enviados, ${failed.length} fallidos`, failed)
    await sendPushToStudio(studioId, {
      title: `📣 ${CAMPAIGN_NAME}: ${label} enviado`,
      body: `${sent} mensajes enviados${failed.length ? ` · ${failed.length} no se enviaron` : ''}`,
      link: '/dashboard/inbox/campaigns',
    })
  })

  return NextResponse.json({ accepted: true, group }, { status: 202 })
}
