import { after, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignGroupCore } from '@/lib/campaigns/send'
import { CAMPAIGN_GROUPS, type CampaignGroup } from '@/lib/campaigns/audience'
import { CAMPAIGN_NAME } from '@/lib/campaigns/nuevos-trazos'
import { sendPushToStudio } from '@/lib/push/send'

/** Envío programado de la campaña. Lo llama pg_cron (Supabase) a la hora
 * exacta con `Authorization: Bearer CRON_SECRET` y { studioId, group }, o
 * el cron de Vercel (GET, ver vercel.json). Responde al instante y envía en
 * segundo plano (pg_net no espera tanto). */
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

  schedule(studioId, group, new URL(req.url).origin)
  return NextResponse.json({ accepted: true, group }, { status: 202 })
}

/** Cron de Vercel (vercel.json, diario 15:00 UTC = 10:00 Colombia, en
 * Hobby puede correr hasta las 10:59). Solo actúa en la fecha de
 * VERCEL_SCHEDULE; los demás días no hace nada. Reenviar es seguro: solo
 * se envía a quien todavía no recibió la campaña. */
const STUDIO_ID = '809b00a6-5040-43a8-a735-ab306fe5c163'
const VERCEL_SCHEDULE: Record<string, CampaignGroup> = { '2026-10-16': 'B' }

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  const group = VERCEL_SCHEDULE[today]
  if (!group) return NextResponse.json({ skipped: true, today })
  schedule(STUDIO_ID, group, new URL(req.url).origin)
  return NextResponse.json({ accepted: true, group }, { status: 202 })
}

function schedule(studioId: string, group: CampaignGroup, origin: string) {
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
}
