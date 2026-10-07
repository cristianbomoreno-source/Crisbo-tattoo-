import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'

export type SessionStatus = 'scheduled' | 'completed' | 'rescheduled' | 'cancelled'

export type Session = {
  id: string
  studio_id: string
  project_id: string
  artist_id: string
  scheduled_at: string
  duration_minutes: number
  status: SessionStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type SessionWithProject = Session & {
  projects: {
    name: string
    clients: { id: string; name: string; phone: string | null } | null
  } | null
}

/** Agenda personal: cada artista (owner o member) solo ve sus propias
 * sesiones — el estudio completo se ve en `getStudioSessions` (Calendario
 * general, solo owner). */
export async function getSessions(from?: string, to?: string): Promise<Result<SessionWithProject[]>> {
  const studio = await getCurrentStudio()
  const supabase = await createClient()
  let query = supabase
    .from('sessions')
    .select('*, projects(name, clients(id, name, phone))')
    .order('scheduled_at')

  if (from) query = query.gte('scheduled_at', from)
  if (to) query = query.lte('scheduled_at', to)
  // El owner conserva el comportamiento de siempre (ve todo el estudio: es
  // lo que alimentan dashboard/stats/finanzas). Solo un member queda
  // restringido a su propia agenda.
  if (studio && studio.role !== 'owner') query = query.eq('artist_id', studio.artistId)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as SessionWithProject[])
}

/** Calendario general del estudio (Ajustes/Equipo → todo el equipo, cada
 * tatuador con su color). Solo tiene sentido para el owner. */
export async function getStudioSessions(
  from?: string,
  to?: string
): Promise<Result<(SessionWithProject & { artists: { id: string; name: string } | null })[]>> {
  const supabase = await createClient()
  let query = supabase
    .from('sessions')
    .select('*, projects(name, clients(id, name, phone)), artists(id, name)')
    .order('scheduled_at')

  if (from) query = query.gte('scheduled_at', from)
  if (to) query = query.lte('scheduled_at', to)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as (SessionWithProject & { artists: { id: string; name: string } | null })[])
}

export async function getSessionsByProject(projectId: string): Promise<Result<Session[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('scheduled_at')

  if (error) return dbError(error)
  return ok(data as Session[])
}
