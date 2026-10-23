import type { SupabaseClient } from '@supabase/supabase-js'

/** Datos del análisis de redes que escribe el dueño desde la app (meta de
 * ingresos, cifras mensuales de TikTok y Google) y el token de Meta para
 * Facebook/anuncios. Viven como JSON en un bucket PRIVADO de Storage (solo el
 * service role lo lee): el token nunca llega al navegador. */

const BUCKET = 'studio-private'

export type TiktokMonth = { followers: number | null; views: number | null; profileViews: number | null }
export type GoogleMonth = {
  views: number | null
  directions: number | null
  calls: number | null
  webClicks: number | null
  reviews: number | null
}
export type ManualNetwork = 'tiktok' | 'google'

export type SocialSettings = {
  /** Meta de ingresos (pagos recibidos) del mes, COP. */
  revenueGoal: number | null
  manual: { tiktok: Record<string, TiktokMonth>; google: Record<string, GoogleMonth> }
}

export type MetaSecret = { token: string; savedAt: string }

const settingsPath = (studioId: string) => `${studioId}/social-settings.json`
const metaPath = (studioId: string) => `${studioId}/meta-token.json`

const EMPTY: SocialSettings = { revenueGoal: null, manual: { tiktok: {}, google: {} } }

async function readJson<T>(admin: SupabaseClient, path: string): Promise<T | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(path)
  if (error || !data) return null
  try {
    return JSON.parse(await data.text()) as T
  } catch {
    return null
  }
}

async function writeJson(admin: SupabaseClient, path: string, value: unknown) {
  const body = new Blob([JSON.stringify(value)], { type: 'application/json' })
  let { error } = await admin.storage.from(BUCKET).upload(path, body, { upsert: true, contentType: 'application/json' })
  if (error && /not found/i.test(error.message)) {
    // Primera escritura: el bucket aún no existe.
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await admin.storage.from(BUCKET).upload(path, body, { upsert: true, contentType: 'application/json' }))
  }
  if (error) throw new Error(error.message)
}

export async function loadSocialSettings(admin: SupabaseClient, studioId: string): Promise<SocialSettings> {
  const raw = await readJson<Partial<SocialSettings>>(admin, settingsPath(studioId))
  return {
    revenueGoal: raw?.revenueGoal ?? null,
    manual: { tiktok: raw?.manual?.tiktok ?? {}, google: raw?.manual?.google ?? {} },
  }
}

export async function saveSocialSettings(
  admin: SupabaseClient,
  studioId: string,
  update: (current: SocialSettings) => SocialSettings
) {
  const current = (await loadSocialSettings(admin, studioId)) ?? EMPTY
  await writeJson(admin, settingsPath(studioId), update(current))
}

export async function loadMetaSecret(admin: SupabaseClient, studioId: string): Promise<MetaSecret | null> {
  const raw = await readJson<MetaSecret>(admin, metaPath(studioId))
  return raw?.token ? raw : null
}

export async function saveMetaSecret(admin: SupabaseClient, studioId: string, token: string) {
  await writeJson(admin, metaPath(studioId), { token, savedAt: new Date().toISOString() } satisfies MetaSecret)
}

export async function deleteMetaSecret(admin: SupabaseClient, studioId: string) {
  await admin.storage.from(BUCKET).remove([metaPath(studioId)])
}
