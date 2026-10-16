import { timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'

/** Autoriza las llamadas de los crons: `Authorization: Bearer <token>` con
 * CRON_SECRET (pg_cron) o el token OIDC de GitHub Actions de este repo en
 * main (respaldo manual, sin secretos compartidos). */
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

export async function authorizedCron(req: Request) {
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!got) return false
  const secret = process.env.CRON_SECRET?.trim()
  if (secret && secret.length === got.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret))) return true
  return got.split('.').length === 3 && fromGitHubActions(got)
}

