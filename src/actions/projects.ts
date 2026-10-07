'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import {
  createProjectSchema,
  updateProjectSessionsDepositSchema,
  updateProjectValueSchema,
} from '@/lib/validations/projects'
import { ownsRow } from '@/lib/authz'
import { revalidatePath } from 'next/cache'
import type { ProjectSummary, ProjectStatus } from '@/queries/projects'
import { getCurrentPermissions } from '@/queries/permissions'

async function getArtistAndStudio() {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('id, studio_id').single()
  return data
}

export async function createProjectAction(input: unknown): Promise<Result<ProjectSummary>> {
  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_create_projects)
    return err('FORBIDDEN', 'No tienes permiso para crear proyectos')

  if (!(await ownsRow('clients', parsed.data.client_id)))
    return err('NOT_FOUND', 'Cliente no encontrado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...parsed.data, studio_id: artist.studio_id, artist_id: artist.id })
    .select('*, clients(name), sessions(id, status, scheduled_at, duration_minutes), payments(amount)')
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  return ok(data as ProjectSummary)
}

export async function updateProjectStatusAction(
  id: string,
  status: ProjectStatus
): Promise<Result<ProjectSummary>> {
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_projects)
    return err('FORBIDDEN', 'No tienes permiso para editar proyectos')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    // Al marcar completado, el progreso se fija en 100% de una vez (ya no
    // depende de cuántas sesiones tenga marcadas como hechas) y se guarda
    // `completed_at` -- es la fecha que usa el seguimiento de 15 días
    // (Edge Function `followup-reminders`) para saber cuándo avisar.
    .update(
      status === 'completed'
        ? { status, manual_progress: 100, completed_at: new Date().toISOString(), followup_sent_at: null }
        : { status }
    )
    .eq('id', id)
    .select('*, clients(name), sessions(id, status, scheduled_at, duration_minutes), payments(amount)')
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  return ok(data as ProjectSummary)
}

export async function updateProjectProgressAction(
  id: string,
  percent: number | null
): Promise<Result<void>> {
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_projects)
    return err('FORBIDDEN', 'No tienes permiso para editar proyectos')

  // null = volver al progreso automático (calculado por sesiones completadas).
  const clamped = percent === null ? null : Math.max(0, Math.min(100, Math.round(percent)))
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ manual_progress: clamped })
    .eq('id', id)

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  return ok(undefined)
}

export async function updateProjectSessionsDepositAction(
  id: string,
  input: unknown
): Promise<Result<ProjectSummary>> {
  const parsed = updateProjectSessionsDepositSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_projects)
    return err('FORBIDDEN', 'No tienes permiso para editar proyectos')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('id', id)
    .select('*, clients(name), sessions(id, status, scheduled_at, duration_minutes), payments(amount)')
    .single()

  if (error) return dbError(error)
  revalidatePath(`/dashboard/projects/${id}`)
  return ok(data as ProjectSummary)
}

/** Edita el valor total del proyecto (precargado desde la cotización al
 * convertirla, pero editable después — mismo patrón que sesiones/abono). */
export async function updateProjectValueAction(
  id: string,
  input: unknown
): Promise<Result<ProjectSummary>> {
  const parsed = updateProjectValueSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_modify_prices)
    return err('FORBIDDEN', 'No tienes permiso para modificar precios')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('id', id)
    .select('*, clients(name), sessions(id, status, scheduled_at, duration_minutes), payments(amount)')
    .single()

  if (error) return dbError(error)
  revalidatePath(`/dashboard/projects/${id}`)
  revalidatePath('/dashboard/projects')
  return ok(data as ProjectSummary)
}

export async function deleteProjectAction(id: string): Promise<Result<void>> {
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_delete_projects)
    return err('FORBIDDEN', 'No tienes permiso para eliminar proyectos')

  const supabase = await createClient()

  // Capturar las rutas de Storage ANTES del delete: el cascade borra las filas
  // de gallery pero no los archivos, que quedarían públicos y huérfanos.
  const { data: photos } = await supabase
    .from('gallery')
    .select('storage_path')
    .eq('project_id', id)

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return dbError(error)

  // Limpieza best-effort: si falla, el proyecto ya no existe (fuente de verdad)
  // y solo quedan archivos sueltos; no bloqueamos al usuario por eso.
  const paths = (photos ?? []).map((p) => p.storage_path).filter(Boolean)
  if (paths.length > 0) {
    const { error: rmError } = await supabase.storage.from('gallery').remove(paths)
    if (rmError) console.error('No se pudieron borrar fotos de Storage:', rmError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  return ok(undefined)
}
