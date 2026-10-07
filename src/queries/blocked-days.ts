import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type BlockedDay = { id: string; date: string; reason: string | null }

export async function getBlockedDays(from: string, to: string): Promise<Result<BlockedDay[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocked_days')
    .select('id, date, reason')
    .gte('date', from)
    .lte('date', to)

  if (error) return dbError(error)
  return ok(data as BlockedDay[])
}

/** Fechas ('YYYY-MM-DD') bloqueadas del estudio en el rango [from, to]. RLS limita al estudio del usuario.
 * Variante liviana de `getBlockedDays` (que devuelve `Result<BlockedDay[]>` para el calendario):
 * esta devuelve solo las claves de día, para las agregaciones puras de `month-metrics`. */
export async function getBlockedDayKeys(from: string, to: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocked_days')
    .select('date')
    .gte('date', from)
    .lte('date', to)
  if (error || !data) return []
  return data.map((r) => (r as { date: string }).date)
}
