import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
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

const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com'
const GITHUB_REPO = 'cristianbomoreno-source/Crisbo-tattoo-'
const CONSENTS_OIDC_AUDIENCE = 'crisbotattoo-consents'
const githubKeys = createRemoteJWKSet(new URL(`${GITHUB_ISSUER}/.well-known/jwks`))

async function fromGitHubActions(token: string) {
  try {
    const { payload } = await jwtVerify(token, githubKeys, { issuer: GITHUB_ISSUER, audience: CONSENTS_OIDC_AUDIENCE })
    return payload.repository === GITHUB_REPO && payload.ref === 'refs/heads/main'
  } catch {
    return false
  }
}

async function authorized(req: Request) {
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!got) return false
  const secret = process.env.CRON_SECRET?.trim()
  if (secret && secret.length === got.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret))) return true
  return got.split('.').length === 3 && fromGitHubActions(got)
}

async function run(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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
