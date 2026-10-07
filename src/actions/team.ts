'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { randomInt } from 'crypto'
import { revalidatePath } from 'next/cache'
import type { ArtistPermissions } from '@/lib/permissions/types'
import { initTourProgress } from '@/lib/tour/init-tour-progress'

/** Mismo patrón que `requireOwner` en src/actions/studio.ts. */
async function requireOwner(): Promise<Result<{ studioId: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner')
    return err('AUTH_ERROR', 'Solo el dueño del estudio puede administrar el equipo')
  return ok({ studioId: studio.id })
}

/** El paso 1 del wizard de tatuador (perfil) ya crea un estudio propio antes
 * de llegar al paso 3 ("¿cómo trabajas?"). Si ahí elige "Trabajo en un
 * estudio", ese estudio recién creado es solo un stub sin nada más (nadie
 * más pudo haberse unido, no hay clientes/proyectos: se creó hace segundos)
 * — se borra para que pueda unirse a otro estudio real sin quedar "dueño"
 * de uno fantasma ni bloqueado por `/onboarding/join`. */
export async function abandonStudioForJoin(): Promise<Result<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { data: artist } = await admin
    .from('artists')
    .select('id, studio_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!artist || artist.role !== 'owner') return ok(undefined)

  const { count } = await admin
    .from('artists')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', artist.studio_id)
  // Si ya hay más de un artista en ese estudio, no es un stub — no se toca.
  if ((count ?? 0) > 1) return ok(undefined)

  await admin.from('artists').delete().eq('id', artist.id)
  await admin.from('studios').delete().eq('id', artist.studio_id)

  return ok(undefined)
}

export type StudioSearchResult = {
  id: string
  name: string
  city: string | null
  logoUrl: string | null
  ownerName: string | null
  artistCount: number
}

/** Paso 1 del flujo "Trabajo en un estudio": busca por código de acceso. */
export async function findStudioByJoinCode(codeInput: string): Promise<Result<StudioSearchResult>> {
  const code = codeInput.trim().toUpperCase()
  if (!code) return err('VALIDATION_ERROR', 'Ingresa un código de estudio')

  const admin = createAdminClient()
  const { data: studio, error } = await admin
    .from('studios')
    .select('id, name, city, logo_url')
    .eq('join_code', code)
    .maybeSingle()
  if (error) return dbError(error)
  if (!studio) return err('NOT_FOUND', 'No encontramos ningún estudio con ese código')

  const { data: artists } = await admin
    .from('artists')
    .select('name, role')
    .eq('studio_id', studio.id)
    .eq('status', 'active')

  const owner = artists?.find((a) => a.role === 'owner')

  return ok({
    id: studio.id,
    name: studio.name,
    city: studio.city,
    logoUrl: studio.logo_url,
    ownerName: owner?.name ?? null,
    artistCount: artists?.length ?? 0,
  })
}

/** Paso 2: el tatuador solicita unirse. Queda pendiente de aprobación. */
export async function requestToJoinStudio(input: {
  studioId: string
  name: string
  specialty?: string
}): Promise<Result<void>> {
  if (!input.name.trim()) return err('VALIDATION_ERROR', 'Ingresa tu nombre')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingArtist) return err('VALIDATION_ERROR', 'Ya perteneces a un estudio')

  const { error } = await supabase.from('studio_join_requests').insert({
    studio_id: input.studioId,
    user_id: user.id,
    name: input.name.trim(),
    email: user.email ?? null,
    specialty: input.specialty?.trim() || null,
    status: 'pending',
  })
  if (error) return dbError(error)

  revalidatePath('/onboarding')
  return ok(undefined)
}

export type MyJoinRequestStatus = {
  status: 'pending' | 'approved' | 'rejected'
  studioName: string
} | null

/** Página de espera: consulta el estado de la última solicitud del usuario. */
export async function getMyJoinRequestStatus(): Promise<Result<MyJoinRequestStatus>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const { data, error } = await supabase
    .from('studio_join_requests')
    .select('status, studio:studios(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return dbError(error)
  if (!data) return ok(null)

  const studio = data.studio as unknown as { name: string } | null
  return ok({
    status: data.status as 'pending' | 'approved' | 'rejected',
    studioName: studio?.name ?? '',
  })
}

export type PendingJoinRequest = {
  id: string
  name: string
  email: string | null
  specialty: string | null
  createdAt: string
}

/** Equipo → solicitudes pendientes del estudio (solo owner). */
export async function listJoinRequests(): Promise<Result<PendingJoinRequest[]>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studio_join_requests')
    .select('id, name, email, specialty, created_at')
    .eq('studio_id', gate.data.studioId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) return dbError(error)

  return ok(
    (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      specialty: r.specialty,
      createdAt: r.created_at,
    }))
  )
}

const DEFAULT_MEMBER_PERMISSIONS: Omit<ArtistPermissions, 'can_block_schedule' | 'can_delete_projects' | 'can_modify_prices' | 'can_create_inventory_categories' | 'can_edit_inventory'> = {
  can_create_appointments: true,
  can_move_appointments: true,
  can_cancel_sessions: true,
  can_create_clients: true,
  can_edit_clients: true,
  can_create_projects: true,
  can_edit_projects: true,
  can_respond_quotes: true,
  can_edit_duration: true,
  can_use_inventory: true,
  can_discount_materials: true,
}

/** Aprueba: crea artists (role='member') + fila de permisos por defecto. */
export async function approveJoinRequest(requestId: string): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()

  const { data: request, error: reqErr } = await admin
    .from('studio_join_requests')
    .select('id, studio_id, user_id, name, status')
    .eq('id', requestId)
    .single()
  if (reqErr) return dbError(reqErr)
  if (!request || request.studio_id !== gate.data.studioId)
    return err('NOT_FOUND', 'Solicitud no encontrada')
  if (request.status !== 'pending') return err('VALIDATION_ERROR', 'Esta solicitud ya fue resuelta')

  const { count } = await admin
    .from('artists')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', gate.data.studioId)
    .eq('status', 'active')
  if ((count ?? 0) >= 20) return err('VALIDATION_ERROR', 'El estudio ya tiene el máximo de 20 tatuadores')

  const { data: artist, error: artistErr } = await admin
    .from('artists')
    .insert({
      studio_id: request.studio_id,
      user_id: request.user_id,
      name: request.name,
      role: 'member',
      status: 'active',
    })
    .select('id')
    .single()
  if (artistErr) return dbError(artistErr)

  const { error: permErr } = await admin
    .from('artist_permissions')
    .insert({ artist_id: artist.id, ...DEFAULT_MEMBER_PERMISSIONS })
  if (permErr) return dbError(permErr)

  await initTourProgress(admin, artist.id, 'tatuador')

  const { error: updErr } = await admin
    .from('studio_join_requests')
    .update({ status: 'approved', resolved_at: new Date().toISOString() })
    .eq('id', requestId)
  if (updErr) return dbError(updErr)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

export async function rejectJoinRequest(requestId: string): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const { error } = await admin
    .from('studio_join_requests')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('studio_id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Alfabeto sin caracteres ambiguos (0/O, 1/I/L) — el código se dicta y se
 * escribe a mano, así que confundirlos cuesta un intento fallido. */
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** 6 caracteres con RNG criptográfico (~29 bits). `Math.random()` no sirve
 * acá: es predecible, y este código es lo que protege quién puede *pedir*
 * entrar al estudio. */
function randomJoinCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)]
  }
  return out
}

/** Ajustes → Equipo → "Generar nuevo código" (revoca el anterior de una). */
export async function regenerateJoinCode(): Promise<Result<string>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const newCode = `OFK-${randomJoinCode()}`
  const { error } = await admin
    .from('studios')
    .update({ join_code: newCode })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/equipo')
  return ok(newCode)
}

export type TeamMember = {
  id: string
  name: string
  role: string
  status: string
  specialty: string | null
}

/** Equipo → lista de tatuadores del estudio (solo owner). */
export async function listTeam(): Promise<Result<TeamMember[]>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, role, status, specialty')
    .eq('studio_id', gate.data.studioId)
    .order('role', { ascending: true })
  if (error) return dbError(error)

  return ok(data ?? [])
}

export async function getArtistPermissions(artistId: string): Promise<Result<ArtistPermissions>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('artist_permissions')
    .select(
      'can_create_appointments, can_move_appointments, can_block_schedule, can_cancel_sessions, can_create_clients, can_edit_clients, can_create_projects, can_edit_projects, can_delete_projects, can_respond_quotes, can_modify_prices, can_edit_duration, can_use_inventory, can_discount_materials, can_create_inventory_categories, can_edit_inventory'
    )
    .eq('artist_id', artistId)
    .single()
  if (error) return dbError(error)
  return ok(data)
}

export async function updateArtistPermissions(
  artistId: string,
  patch: Partial<ArtistPermissions>
): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const { data: artist } = await admin
    .from('artists')
    .select('studio_id')
    .eq('id', artistId)
    .single()
  if (!artist || artist.studio_id !== gate.data.studioId)
    return err('NOT_FOUND', 'Tatuador no encontrado')

  const { error } = await admin.from('artist_permissions').update(patch).eq('artist_id', artistId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Equipo → desactivar un tatuador (no lo borra, solo bloquea su acceso). */
export async function setArtistStatus(
  artistId: string,
  status: 'active' | 'rejected'
): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const { data: artist } = await admin
    .from('artists')
    .select('studio_id, role')
    .eq('id', artistId)
    .single()
  if (!artist || artist.studio_id !== gate.data.studioId)
    return err('NOT_FOUND', 'Tatuador no encontrado')
  if (artist.role === 'owner') return err('VALIDATION_ERROR', 'No puedes desactivar al dueño')

  const { error } = await admin.from('artists').update({ status }).eq('id', artistId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}
