import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDueConsents } from '@/lib/consents/send-due'

/** Envía el consentimiento por WhatsApp a las citas que empezaron hace 5
 * min. Lo llama cada pocos minutos un cron externo (GitHub Actions,
 * .github/workflows/consents-cron.yml; o pg_cron, ver consents-cron.sql)
 * con `Authorization: Bearer <CRON_SECRET o CONSENT_CRON_SECRET>`.
 * Es idempotente: una cita nunca recibe dos. */
export const maxDuration = 60

function authorized(req: Request) {
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!got) return false
  return [process.env.CRON_SECRET, process.env.CONSENT_CRON_SECRET].some((secret) => {
    const s = secret?.trim()
    return !!s && s.length === got.length && timingSafeEqual(Buffer.from(got), Buffer.from(s))
  })
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const res = await sendDueConsents(createAdminClient())
    if (res.sent || res.failed.length || res.skipped) console.log('[consent-cron]', res)
    return NextResponse.json(res)
  } catch (e) {
    console.error('[consent-cron]', (e as Error).message)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export const GET = run
export const POST = run
