'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'
import { FEEDBACK_SECTIONS } from '@/lib/feedback/features'
import { STUDIO_FEATURES, type FeatureKey } from '@/lib/features/catalog'

/** ¿El usuario actual está en `platform_admins`? Se consulta con el
 * cliente admin (service role) porque esa tabla no tiene policies para
 * `authenticated` — nadie puede leerla/escribirla directo desde el
 * cliente, solo a través de estas server actions. */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const admin = createAdminClient()
  const { data } = await admin.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  return !!data
}

export async function hasAnyPlatformAdmin(): Promise<boolean> {
  const admin = createAdminClient()
  const { count } = await admin.from('platform_admins').select('user_id', { count: 'exact', head: true })
  return (count ?? 0) > 0
}

/** Reclama el acceso de administrador — SOLO funciona si todavía no hay
 * ningún administrador (primer arranque). Después de esto, agregar a
 * alguien más se hace desde /admin (por correo), no con esta acción. */
export async function bootstrapFirstAdmin(): Promise<Result<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { count } = await admin.from('platform_admins').select('user_id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return err('FORBIDDEN', 'Ya hay administradores — pide que te agreguen desde /admin')

  const { error } = await admin
    .from('platform_admins')
    .insert({ user_id: user.id, email: user.email ?? null })
  if (error) return dbError(error)

  revalidatePath('/admin')
  return ok(undefined)
}

export type PlatformAdminRow = { userId: string; email: string | null; createdAt: string }

export async function listPlatformAdmins(): Promise<Result<PlatformAdminRow[]>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('platform_admins')
    .select('user_id, email, created_at')
    .order('created_at', { ascending: true })
  if (error) return dbError(error)

  return ok((data ?? []).map((r) => ({ userId: r.user_id, email: r.email, createdAt: r.created_at })))
}

/** Agrega a otro administrador por correo — busca su cuenta entre los
 * usuarios de Supabase Auth (no hay tabla de perfiles con email propia). */
export async function addPlatformAdminByEmail(email: string): Promise<Result<void>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')
  const target = email.trim().toLowerCase()
  if (!target) return err('VALIDATION_ERROR', 'Ingresa un correo')

  const admin = createAdminClient()
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return err('DB_ERROR', 'No se pudo buscar la cuenta')

  const found = usersPage.users.find((u) => u.email?.toLowerCase() === target)
  if (!found) return err('NOT_FOUND', 'No encontramos ninguna cuenta de OFINK con ese correo')

  const { error } = await admin
    .from('platform_admins')
    .upsert({ user_id: found.id, email: found.email ?? target })
  if (error) return dbError(error)

  revalidatePath('/admin')
  return ok(undefined)
}

export async function removePlatformAdmin(userId: string): Promise<Result<void>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { error } = await admin.from('platform_admins').delete().eq('user_id', userId)
  if (error) return dbError(error)

  revalidatePath('/admin')
  return ok(undefined)
}

export type PlatformSignupRow = {
  userId: string
  email: string | null
  username: string | null
  authProvider: string
  device: string
  createdAt: string
}

/** Historial de creación de cuentas OFINK: correo/usuario, si entró por
 * Google o por usuario+contraseña, y si fue desde móvil o escritorio
 * (por user-agent). Ver record-signup.ts (se guarda al momento del alta). */
export async function listPlatformSignups(): Promise<Result<PlatformSignupRow[]>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('platform_signups')
    .select('user_id, email, username, auth_provider, device, created_at')
    .order('created_at', { ascending: false })
  if (error) return dbError(error)

  return ok(
    (data ?? []).map((r) => ({
      userId: r.user_id,
      email: r.email,
      username: r.username,
      authProvider: r.auth_provider,
      device: r.device,
      createdAt: r.created_at,
    }))
  )
}

export type StudioOption = { id: string; name: string }

/** Estudios/cuentas para el selector del panel de módulos en /admin. */
export async function listStudiosForFeatures(): Promise<Result<StudioOption[]>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { data, error } = await admin.from('studios').select('id, name').order('name', { ascending: true })
  if (error) return dbError(error)

  return ok((data ?? []).map((s) => ({ id: s.id, name: s.name })))
}

/** Estado on/off de cada módulo del catálogo para un estudio puntual —
 * lo que no tiene fila en `studio_features` se muestra encendido. */
export async function getStudioFeatureToggles(
  studioId: string
): Promise<Result<{ key: FeatureKey; label: string; enabled: boolean }[]>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('studio_features')
    .select('feature_key, enabled')
    .eq('studio_id', studioId)
  if (error) return dbError(error)

  const overrides = new Map((data ?? []).map((r) => [r.feature_key, r.enabled]))
  return ok(STUDIO_FEATURES.map((f) => ({ ...f, enabled: overrides.get(f.key) ?? true })))
}

export async function setStudioFeature(
  studioId: string,
  featureKey: FeatureKey,
  enabled: boolean
): Promise<Result<void>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { error } = await admin
    .from('studio_features')
    .upsert({ studio_id: studioId, feature_key: featureKey, enabled }, { onConflict: 'studio_id,feature_key' })
  if (error) return dbError(error)

  revalidatePath('/admin')
  return ok(undefined)
}

export type FeatureAggregate = {
  key: string
  label: string
  sectionTitle: string
  average: number
  count: number
}

export type FeedbackComment = {
  id: string
  featureLabel: string
  rating: number
  comment: string
  studioName: string | null
  artistName: string | null
  createdAt: string
}

export type FeedbackOverview = {
  totalResponses: number
  respondingStudios: number
  overallAverage: number
  byFeature: FeatureAggregate[]
  comments: FeedbackComment[]
}

/** Todo lo que necesita /admin: promedio por función (para identificar
 * qué mejorar primero) y los comentarios sueltos con contexto de quién los
 * dejó. Cruza `feature_feedback` con `artists`/`studios` a mano (con el
 * cliente admin) porque son consultas de solo-lectura para el equipo de
 * OFINK, no para el tatuador. */
export async function getFeedbackOverview(): Promise<Result<FeedbackOverview>> {
  if (!(await isPlatformAdmin())) return err('FORBIDDEN', 'No tienes acceso')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feature_feedback')
    .select('id, feature_key, rating, comment, studio_id, artist_id, created_at')
    .order('created_at', { ascending: false })
  if (error) return dbError(error)

  const rows = data ?? []

  const studioIds = [...new Set(rows.map((r) => r.studio_id).filter((x): x is string => !!x))]
  const artistIds = [...new Set(rows.map((r) => r.artist_id).filter((x): x is string => !!x))]

  const [studiosRes, artistsRes] = await Promise.all([
    studioIds.length
      ? admin.from('studios').select('id, name').in('id', studioIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    artistIds.length
      ? admin.from('artists').select('id, name').in('id', artistIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])
  const studioNames = new Map((studiosRes.data ?? []).map((s) => [s.id, s.name]))
  const artistNames = new Map((artistsRes.data ?? []).map((a) => [a.id, a.name]))

  const labelByKey = new Map<string, { label: string; sectionTitle: string }>()
  for (const section of FEEDBACK_SECTIONS) {
    for (const feature of section.features) {
      labelByKey.set(feature.key, { label: feature.label, sectionTitle: section.title })
    }
  }

  const byFeatureMap = new Map<string, { sum: number; count: number }>()
  for (const row of rows) {
    const agg = byFeatureMap.get(row.feature_key) ?? { sum: 0, count: 0 }
    agg.sum += row.rating
    agg.count += 1
    byFeatureMap.set(row.feature_key, agg)
  }

  const byFeature: FeatureAggregate[] = FEEDBACK_SECTIONS.flatMap((section) =>
    section.features.map((feature) => {
      const agg = byFeatureMap.get(feature.key)
      return {
        key: feature.key,
        label: feature.label,
        sectionTitle: section.title,
        average: agg ? Math.round((agg.sum / agg.count) * 10) / 10 : 0,
        count: agg?.count ?? 0,
      }
    })
  ).sort((a, b) => {
    if (a.count === 0 && b.count === 0) return 0
    if (a.count === 0) return 1
    if (b.count === 0) return -1
    return a.average - b.average
  })

  const comments: FeedbackComment[] = rows
    .filter((r) => r.comment && r.comment.trim())
    .map((r) => ({
      id: r.id,
      featureLabel: labelByKey.get(r.feature_key)?.label ?? r.feature_key,
      rating: r.rating,
      comment: r.comment as string,
      studioName: r.studio_id ? (studioNames.get(r.studio_id) ?? null) : null,
      artistName: r.artist_id ? (artistNames.get(r.artist_id) ?? null) : null,
      createdAt: r.created_at,
    }))

  const totalResponses = rows.length
  const overallAverage =
    totalResponses > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / totalResponses) * 10) / 10 : 0
  const respondingStudios = new Set(rows.map((r) => r.studio_id).filter(Boolean)).size

  return ok({ totalResponses, respondingStudios, overallAverage, byFeature, comments })
}
