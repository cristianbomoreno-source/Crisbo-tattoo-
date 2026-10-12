'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'
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
  if (!found) return err('NOT_FOUND', 'No encontramos ninguna cuenta de Crisbo Tattoo con ese correo')

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

/** Historial de creación de cuentas Crisbo Tattoo: correo/usuario, si entró por
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
