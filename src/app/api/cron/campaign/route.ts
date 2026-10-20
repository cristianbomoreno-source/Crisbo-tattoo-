import { after, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignGroupCore, sendCampaignReminderCore } from '@/lib/campaigns/send'
import { CAMPAIGN_GROUPS, type CampaignGroup } from '@/lib/campaigns/audience'
import { CAMPAIGN_NAME } from '@/lib/campaigns/nuevos-trazos'
import { sendPushToStudio } from '@/lib/push/send'
import { sendBonoScheduledCore } from '@/lib/campaigns/bono-send'
import { BONO_NAME } from '@/lib/campaigns/bono'

/** Envío programado de la campaña. Lo llama pg_cron (Supabase) a la hora
 * exacta con `Authorization: Bearer CRON_SECRET` y { studioId, group, kind? }, o
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
  const body = (await req.json().catch(() => ({}))) as { studioId?: string; group?: string; kind?: string }
  const { studioId, group } = body
  // Bono de agradecimiento: { studioId, kind: 'bono' } — sin grupo.
  if (body.kind === 'bono') {
    if (!studioId) return NextResponse.json({ error: 'studioId es obligatorio' }, { status: 400 })
    scheduleBono(studioId)
    return NextResponse.json({ accepted: true, kind: 'bono' }, { status: 202 })
  }
  const kind: Kind = body.kind === 'reminder' ? 'reminder' : 'send'
  if (!studioId || (group !== 'A' && group !== 'B')) {
    return NextResponse.json({ error: 'studioId y group (A|B) son obligatorios' }, { status: 400 })
  }

  schedule(studioId, [{ group, kind }], new URL(req.url).origin)
  return NextResponse.json({ accepted: true, group, kind }, { status: 202 })
}

type Kind = 'send' | 'reminder'
type Job = { group: CampaignGroup; kind: Kind }

/** Cron de Vercel (vercel.json, diario 15:00 UTC = 10:00 Colombia, en
 * Hobby puede correr hasta las 10:59). Solo actúa en la fecha de
 * VERCEL_SCHEDULE; los demás días no hace nada. Reenviar es seguro: solo
 * se envía a quien todavía no recibió la campaña. */
const STUDIO_ID = '809b00a6-5040-43a8-a735-ab306fe5c163'
const VERCEL_SCHEDULE: Record<string, Job[]> = {
  '2026-10-16': [{ group: 'B', kind: 'send' }],
  // Recordatorio "quedan 5 cupos" a A y B (y a quienes la campaña les falló).
  '2026-10-20': [
    { group: 'A', kind: 'reminder' },
    { group: 'B', kind: 'reminder' },
  ],
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  const jobs = VERCEL_SCHEDULE[today]
  if (!jobs) return NextResponse.json({ skipped: true, today })
  schedule(STUDIO_ID, jobs, new URL(req.url).origin)
  return NextResponse.json({ accepted: true, jobs }, { status: 202 })
}

/** Los trabajos van uno tras otro (no en paralelo: comparten límites de Meta). */
function schedule(studioId: string, jobs: Job[], origin: string) {
  after(async () => {
    for (const job of jobs) await runJob(studioId, job, origin)
  })
}

async function runJob(studioId: string, { group, kind }: Job, origin: string) {
  const label = `${kind === 'reminder' ? 'recordatorio del ' : ''}${CAMPAIGN_GROUPS[group].label}`
  const core = kind === 'reminder' ? sendCampaignReminderCore : sendCampaignGroupCore
  const res = await core(createAdminClient(), { studioId, group, origin, sentBy: null })
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
}

/** Tanda máxima por corrida: ~250 envíos caben holgados en los 300 s. */
const BONO_BATCH = 250

function scheduleBono(studioId: string) {
  after(async () => {
    const res = await sendBonoScheduledCore(createAdminClient(), { studioId, limit: BONO_BATCH })
    if (!res.success) {
      console.error(`[campaign] bono: ${res.error.message}`)
      await sendPushToStudio(studioId, {
        title: `⚠️ ${BONO_NAME}: no se envió`,
        body: res.error.message,
        link: '/dashboard/inbox/campaigns/bono',
      })
      return
    }
    const { sent, failed, remaining } = res.data
    console.log(`[campaign] bono: ${sent} enviados, ${failed.length} fallidos, quedan ${remaining}`, failed)
    if (!sent && !failed.length) return
    await sendPushToStudio(studioId, {
      title: `🎁 ${BONO_NAME}: ${sent} enviados`,
      body: `${failed.length ? `${failed.length} no se enviaron · ` : ''}${remaining ? `quedan ${remaining} para la próxima tanda` : 'ya salieron todos'}`,
      link: '/dashboard/inbox/campaigns/bono',
    })
  })
}
