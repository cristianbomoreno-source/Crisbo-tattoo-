import { NextResponse } from 'next/server'
import { authorizedCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDueConsents } from '@/lib/consents/send-due'

/** Envía el consentimiento por WhatsApp a las citas que empezaron hace 5
 * min. Lo llama cada pocos minutos un cron externo con
 * `Authorization: Bearer <token>`:
 * - GitHub Actions (.github/workflows/consents-cron.yml) con su token OIDC:
 *   GitHub lo firma, se verifica contra sus llaves públicas y que venga de
 *   este repo en main — sin secretos compartidos.
 * - o pg_cron (consents-cron.sql) / manual con CRON_SECRET.
 * Es idempotente: una cita nunca recibe dos. */
export const maxDuration = 60

async function run(req: Request) {
  if (!(await authorizedCron(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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
