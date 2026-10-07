import { createClient } from '@/lib/supabase/server'

type ConflictCheckInput = {
  studioId: string
  scheduledAt: string
  durationMinutes: number
  excludeSessionId?: string
}

export type SessionConflict = {
  id: string
  scheduledAt: string
  projectName: string | null
  clientName: string | null
}

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number
  projects: { name: string; clients: { name: string } | null } | null
}

/**
 * Busca una sesión del mismo estudio cuyo horario se solape con el propuesto.
 * Ventana de ±24h alrededor del rango nuevo: cubre cualquier solapamiento
 * posible dado que duration_minutes está topado en 600 (10h).
 */
export async function findSessionConflict({
  studioId,
  scheduledAt,
  durationMinutes,
  excludeSessionId,
}: ConflictCheckInput): Promise<SessionConflict | null> {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const windowFrom = new Date(start.getTime() - 24 * 60 * 60_000).toISOString()
  const windowTo = new Date(end.getTime() + 24 * 60 * 60_000).toISOString()

  const supabase = await createClient()
  let query = supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, projects(name, clients(name))')
    .eq('studio_id', studioId)
    .neq('status', 'cancelled')
    .gte('scheduled_at', windowFrom)
    .lte('scheduled_at', windowTo)

  if (excludeSessionId) query = query.neq('id', excludeSessionId)

  const { data, error } = await query
  if (error || !data) return null

  for (const row of data as unknown as SessionRow[]) {
    const rowStart = new Date(row.scheduled_at)
    const rowEnd = new Date(rowStart.getTime() + row.duration_minutes * 60_000)
    if (rowStart < end && start < rowEnd) {
      return {
        id: row.id,
        scheduledAt: row.scheduled_at,
        projectName: row.projects?.name ?? null,
        clientName: row.projects?.clients?.name ?? null,
      }
    }
  }
  return null
}

/** true si la fecha (parte YYYY-MM-DD de scheduledAt) está bloqueada para el estudio. */
export async function findBlockedDay(studioId: string, scheduledAt: string): Promise<boolean> {
  const dateKey = scheduledAt.slice(0, 10)
  const supabase = await createClient()
  const { data } = await supabase
    .from('blocked_days')
    .select('id')
    .eq('studio_id', studioId)
    .eq('date', dateKey)
    .maybeSingle()
  return Boolean(data)
}

// getUTCDay(): 0=domingo, 1=lunes, ... 6=sábado — coincide con los valores
// de `studios.open_days` (Ajustes → Horario, WEEK_DAYS en onboarding/constants).
const WEEKDAY_CODES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const

/** true si el día de la semana de `scheduledAt` (hora-de-pared, igual que
 * `dayKey` en calendar/utils) NO está entre los días de atención que el
 * estudio configuró en Ajustes → Horario. Antes esto no se validaba en
 * ningún lado: se podía agendar en un día marcado como "no laboral" (p. ej.
 * domingo) sin ningún aviso. Si el estudio no configuró `open_days`
 * (null/vacío), no restringe nada — mismo comportamiento de siempre. */
export async function isWeekdayClosed(studioId: string, scheduledAt: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: studio } = await supabase
    .from('studios')
    .select('open_days')
    .eq('id', studioId)
    .maybeSingle()
  const openDays = studio?.open_days as string[] | null | undefined
  if (!openDays || openDays.length === 0) return false
  const code = WEEKDAY_CODES[new Date(scheduledAt).getUTCDay()]!
  return !openDays.includes(code)
}
