import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'

export type ProjectStatus = 'quote' | 'design' | 'approval' | 'scheduled' | 'in_progress' | 'completed'

export type ProjectSummary = {
  id: string
  studio_id: string
  client_id: string
  artist_id: string
  name: string
  status: ProjectStatus
  total_value: number | null
  deposit: number | null
  session_count: number | null
  deposit_percentage: number | null
  notes: string | null
  manual_progress: number | null
  /** Minutos realmente trabajados, acumulados por el cronómetro de cada
   * sesión (botón ▶/■) — ver `endSessionShift`. Aparte de `duration_minutes`
   * de cada sesión (el estimado al agendar). */
  worked_minutes: number
  created_at: string
  updated_at: string
  clients: { name: string; phone: string | null } | null
  sessions: { id: string; status: string; scheduled_at: string; duration_minutes: number }[]
  payments: { id: string; amount: number; session_id: string | null; paid_at: string; payment_method: string | null }[]
  gallery: { url: string; created_at: string }[]
  /** Duración por sesión que el tatuador eligió al cotizar ("5h 00m") —
   * precarga el campo de duración al agendar cita desde este proyecto, en
   * vez de quedar siempre en el default de 60 min. `null`/`undefined` si el
   * proyecto no viene de una cotización (creado directo) o esa cotización
   * no tenía duración configurada. */
  quotes: { avg_session_duration: string | null } | null
}

export async function getProjects(status?: ProjectStatus): Promise<Result<ProjectSummary[]>> {
  const studio = await getCurrentStudio()
  const supabase = await createClient()
  let query = supabase
    .from('projects')
    .select('*, clients(name, phone), sessions(id, status, scheduled_at, duration_minutes), payments(id, amount, session_id, paid_at, payment_method), gallery(url, created_at), quotes(avg_session_duration)')
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  // Un member del estudio solo ve sus propios proyectos; el owner ve todos.
  if (studio && studio.role !== 'owner') query = query.eq('artist_id', studio.artistId)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as ProjectSummary[])
}

export async function getProject(id: string): Promise<Result<ProjectSummary>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(name, phone), sessions(id, status, scheduled_at, duration_minutes), payments(id, amount, session_id, paid_at, payment_method), gallery(url, created_at), quotes(avg_session_duration)')
    .eq('id', id)
    .single()

  if (error) return err('NOT_FOUND', 'Proyecto no encontrado')
  return ok(data as ProjectSummary)
}

export async function getProjectsByClient(clientId: string): Promise<Result<ProjectSummary[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(name, phone), sessions(id, status, scheduled_at, duration_minutes), payments(id, amount, session_id, paid_at, payment_method), gallery(url, created_at), quotes(avg_session_duration)')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })

  if (error) return dbError(error)
  return ok(data as ProjectSummary[])
}

/** Id del proyecto creado al convertir una cotización — null si aún no se
 * convirtió. Usado para poder agendar sesiones directamente desde el
 * detalle de la cotización una vez que ya es proyecto. */
export async function getProjectIdByQuoteId(quoteId: string): Promise<Result<string | null>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (error) return dbError(error)
  return ok(data?.id ?? null)
}

/** Igual que `getProjectIdByQuoteId` pero para varias cotizaciones a la vez
 * — usado en la lista de cotizaciones para no hacer una consulta por fila. */
export async function getProjectIdsByQuoteIds(quoteIds: string[]): Promise<Result<Record<string, string>>> {
  if (quoteIds.length === 0) return ok({})
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, quote_id')
    .in('quote_id', quoteIds)

  if (error) return dbError(error)
  const map: Record<string, string> = {}
  for (const row of data) {
    if (row.quote_id) map[row.quote_id] = row.id
  }
  return ok(map)
}
