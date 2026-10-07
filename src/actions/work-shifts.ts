'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'

/** Abre una jornada nueva para el artista actual (tarjeta "Iniciar sesión"
 * del Home en iPad/escritorio). No valida que no haya otra abierta — si la
 * hubiera (doble clic, dos pestañas), el cliente sigue mostrando la más
 * reciente vía `getActiveWorkShift`. */
export async function startWorkShift(): Promise<Result<{ id: string; startedAt: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('work_shifts')
    .insert({ studio_id: studio.id, artist_id: studio.artistId })
    .select('id, started_at')
    .single()
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  return ok({ id: data.id, startedAt: data.started_at })
}

/** Cierra la jornada abierta (tarjeta "Finalizar jornada"). */
export async function endWorkShift(shiftId: string): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('work_shifts')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', shiftId)
    .eq('artist_id', studio.artistId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}
