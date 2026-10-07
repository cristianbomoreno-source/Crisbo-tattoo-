'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'
import { initTourProgress } from '@/lib/tour/init-tour-progress'

/** Mismo patrón que `requireOwner` en src/actions/team.ts (no exportado ahí). */
async function requireOwner(): Promise<Result<{ studioId: string; artistId: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner')
    return err('AUTH_ERROR', 'Solo el dueño del estudio puede invitar colaboradores')
  return ok({ studioId: studio.id, artistId: studio.artistId })
}

const DEFAULT_MEMBER_PERMISSIONS = {
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

/**
 * Botón del pulpo → "Añadir colaborador": invita por correo. Si ese
 * correo ya tiene una cuenta OFINK, queda vinculada de una vez
 * (`invited_user_id`) y la persona ve la invitación apenas entra —
 * ver `listMyPendingInvitations`/`respondToInvitation`. Si no tiene
 * cuenta todavía, la invitación queda esperando por correo — se resuelve
 * sola cuando esa persona se registre (ver /auth/callback).
 */
export async function inviteCollaboratorByEmail(emailInput: string): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const email = emailInput.trim().toLowerCase()
  if (!email || !email.includes('@')) return err('VALIDATION_ERROR', 'Ingresa un correo válido')

  const admin = createAdminClient()

  const { count: teamCount } = await admin
    .from('artists')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', gate.data.studioId)
    .eq('status', 'active')
  if ((teamCount ?? 0) >= 20)
    return err('VALIDATION_ERROR', 'El estudio ya tiene el máximo de 20 tatuadores')

  const { data: existingInvite } = await admin
    .from('studio_invitations')
    .select('id')
    .eq('studio_id', gate.data.studioId)
    .eq('status', 'pending')
    .ilike('invited_email', email)
    .maybeSingle()
  if (existingInvite) return err('VALIDATION_ERROR', 'Ya invitaste a ese correo, está pendiente de respuesta')

  // ¿Ese correo ya tiene cuenta de OFINK? Si sí, vinculamos la invitación
  // a su user_id de una vez (así la ve apenas entra, sin depender de que
  // vuelva a pasar por /auth/callback).
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) return err('DB_ERROR', 'No se pudo verificar el correo')
  const matchedUser = usersPage.users.find((u) => u.email?.toLowerCase() === email)

  if (matchedUser) {
    const { data: existingAccounts } = await admin
      .from('artists')
      .select('id, studio_id, studio:studios!inner(account_kind)')
      .eq('user_id', matchedUser.id)

    const alreadyInThisStudio = existingAccounts?.some((a) => a.studio_id === gate.data.studioId)
    if (alreadyInThisStudio) return err('VALIDATION_ERROR', 'Esa persona ya es parte de tu equipo')

    const hasEstudioAccount = existingAccounts?.some(
      (a) => (a.studio as unknown as { account_kind: string } | null)?.account_kind === 'estudio'
    )
    if (hasEstudioAccount)
      return err(
        'VALIDATION_ERROR',
        'Esa persona ya tiene una cuenta de estudio (propia o de otro equipo) y no puede unirse a otra'
      )
    if ((existingAccounts?.length ?? 0) >= 2)
      return err('VALIDATION_ERROR', 'Esa persona ya tiene el máximo de 2 cuentas OFINK')
  }

  const { error } = await admin.from('studio_invitations').insert({
    studio_id: gate.data.studioId,
    invited_email: email,
    invited_user_id: matchedUser?.id ?? null,
    invited_by_artist_id: gate.data.artistId,
  })
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/equipo')
  return ok(undefined)
}

export type StudioInvitationRow = {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  hasAccount: boolean
}

/** Equipo → invitaciones que mandó el estudio (para verlas y poder cancelarlas). */
export async function listStudioInvitations(): Promise<Result<StudioInvitationRow[]>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studio_invitations')
    .select('id, invited_email, invited_user_id, status, created_at')
    .eq('studio_id', gate.data.studioId)
    .order('created_at', { ascending: false })
  if (error) return dbError(error)

  return ok(
    (data ?? []).map((r) => ({
      id: r.id,
      email: r.invited_email,
      status: r.status as StudioInvitationRow['status'],
      createdAt: r.created_at,
      hasAccount: !!r.invited_user_id,
    }))
  )
}

export async function cancelInvitation(invitationId: string): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const admin = createAdminClient()
  const { error } = await admin
    .from('studio_invitations')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('studio_id', gate.data.studioId)
    .eq('status', 'pending')
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/equipo')
  return ok(undefined)
}

export type MyInvitation = {
  id: string
  studioName: string
  createdAt: string
}

/** Invitaciones pendientes dirigidas al usuario actual (por su user_id ya
 * vinculado, ver `inviteCollaboratorByEmail`) — alimenta el banner en
 * Ajustes y la pantalla de bienvenida para invitados nuevos. */
export async function listMyPendingInvitations(): Promise<Result<MyInvitation[]>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const { data, error } = await supabase
    .from('studio_invitations')
    .select('id, created_at, studio:studios(name)')
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return dbError(error)

  return ok(
    (data ?? []).map((r) => ({
      id: r.id,
      studioName: (r.studio as unknown as { name: string } | null)?.name ?? 'Un estudio',
      createdAt: r.created_at,
    }))
  )
}

/** Acepta o rechaza una invitación. Al aceptar: crea la cuenta 'member'
 * en ese estudio (respetando el tope de 2 cuentas OFINK / 1 cuenta
 * 'estudio' por usuario, igual que el resto del sistema multi-cuenta) y
 * la activa — la persona entra directo a su nuevo equipo. */
export async function respondToInvitation(
  invitationId: string,
  accept: boolean
): Promise<Result<{ studioSlug: string } | void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { data: invitation, error: invErr } = await admin
    .from('studio_invitations')
    .select('id, studio_id, invited_user_id, invited_email, status')
    .eq('id', invitationId)
    .single()
  if (invErr || !invitation) return err('NOT_FOUND', 'Invitación no encontrada')
  if (invitation.invited_user_id !== user.id && invitation.invited_email !== user.email?.toLowerCase())
    return err('FORBIDDEN', 'Esta invitación no es para tu cuenta')
  if (invitation.status !== 'pending') return err('VALIDATION_ERROR', 'Esta invitación ya fue resuelta')

  if (!accept) {
    const { error } = await admin
      .from('studio_invitations')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', invitationId)
    if (error) return dbError(error)
    revalidatePath('/dashboard/settings')
    return ok(undefined)
  }

  const { data: existingAccounts } = await admin
    .from('artists')
    .select('id, studio_id, studio:studios!inner(account_kind)')
    .eq('user_id', user.id)

  const alreadyHere = existingAccounts?.some((a) => a.studio_id === invitation.studio_id)
  if (alreadyHere) return err('VALIDATION_ERROR', 'Ya eres parte de ese equipo')

  const hasEstudioAccount = existingAccounts?.some(
    (a) => (a.studio as unknown as { account_kind: string } | null)?.account_kind === 'estudio'
  )
  if (hasEstudioAccount)
    return err(
      'VALIDATION_ERROR',
      'Ya tienes una cuenta de estudio (propia o de otro equipo) — no puedes unirte a otra'
    )
  if ((existingAccounts?.length ?? 0) >= 2)
    return err('VALIDATION_ERROR', 'Ya tienes el máximo de 2 cuentas OFINK')

  const { count } = await admin
    .from('artists')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', invitation.studio_id)
    .eq('status', 'active')
  if ((count ?? 0) >= 20) return err('VALIDATION_ERROR', 'Ese estudio ya tiene el máximo de tatuadores')

  const metaName = (user.user_metadata['name'] as string | undefined) ?? user.email?.split('@')[0] ?? 'Tatuador'

  const { data: artist, error: artistErr } = await admin
    .from('artists')
    .insert({ studio_id: invitation.studio_id, user_id: user.id, name: metaName, role: 'member', status: 'active' })
    .select('id')
    .single()
  if (artistErr || !artist) return artistErr ? dbError(artistErr) : err('DB_ERROR', 'No se pudo crear la cuenta')

  await admin.from('artist_permissions').insert({ artist_id: artist.id, ...DEFAULT_MEMBER_PERMISSIONS })
  await initTourProgress(admin, artist.id, 'tatuador')

  await admin
    .from('studio_invitations')
    .update({ status: 'accepted', responded_at: new Date().toISOString(), invited_user_id: user.id })
    .eq('id', invitationId)

  await supabase.rpc('set_active_account', { p_artist_id: artist.id })

  const { data: studio } = await admin.from('studios').select('slug').eq('id', invitation.studio_id).single()

  revalidatePath('/dashboard', 'layout')
  return ok({ studioSlug: studio?.slug ?? '' })
}
