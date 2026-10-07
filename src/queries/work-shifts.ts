import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type WorkShift = {
  id: string
  startedAt: string
  endedAt: string | null
}

/** Jornada abierta (sin cerrar) del artista actual, si hay una.
 * - Sin `sessionId`: la jornada GENERAL del día (tarjeta "Iniciar sesión"/
 *   "Finalizar jornada" del Home en iPad/escritorio, sin atar a una cita).
 * - Con `sessionId`: el cronómetro de ESA cita puntual (botón ▶ por cada
 *   sesión agendada, tanto en el Home de escritorio como en la tarjeta
 *   "Próxima sesión" del móvil). */
export async function getActiveWorkShift(
  artistId: string,
  sessionId?: string | null
): Promise<Result<WorkShift | null>> {
  const supabase = await createClient()
  let query = supabase
    .from('work_shifts')
    .select('id, started_at, ended_at')
    .eq('artist_id', artistId)
    .is('ended_at', null)

  query = sessionId ? query.eq('session_id', sessionId) : query.is('session_id', null)

  const { data, error } = await query
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return dbError(error)
  if (!data) return ok(null)
  return ok({ id: data.id, startedAt: data.started_at, endedAt: data.ended_at })
}

/** Todos los cronómetros de sesión puntual abiertos del artista, indexados
 * por `session_id` — para pintar el botón ▶/cronómetro correcto en cada
 * fila de la lista de citas de hoy (escritorio) sin una consulta por fila. */
export async function getActiveSessionShifts(
  artistId: string
): Promise<Result<Record<string, WorkShift>>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('work_shifts')
    .select('id, started_at, ended_at, session_id')
    .eq('artist_id', artistId)
    .is('ended_at', null)
    .not('session_id', 'is', null)

  if (error) return dbError(error)
  const map: Record<string, WorkShift> = {}
  for (const row of data ?? []) {
    if (row.session_id) map[row.session_id] = { id: row.id, startedAt: row.started_at, endedAt: row.ended_at }
  }
  return ok(map)
}
