'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type TourProgressState = {
  tourKey: 'tatuador' | 'estudio'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  currentStep: number
}

/** Recorrido que le corresponde a la cuenta activa según el tipo de Home
 * que ve — mismo criterio que `initTourProgress`, por si la fila de
 * progreso no existiera todavía (cuenta creada antes de este feature y
 * sin backfill, o alguna carrera rara). */
function tourKeyFor(accountKind: 'tatuador' | 'estudio', role: string): 'tatuador' | 'estudio' {
  return accountKind === 'estudio' && role === 'owner' ? 'estudio' : 'tatuador'
}

/** Progreso del tour para la cuenta activa. `null` si no hay sesión. Si la
 * cuenta no tiene fila todavía (caso raro, cuentas pre-feature sin
 * backfill), se comporta como 'completed' — nunca auto-abre el tour para
 * quien no pasó por el flujo de creación de cuenta nuevo. */
export async function getMyTourProgress(): Promise<Result<TourProgressState>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tour_progress')
    .select('tour_key, status, current_step')
    .eq('artist_id', studio.artistId)
    .maybeSingle()
  if (error) return dbError(error)

  if (!data) {
    return ok({ tourKey: tourKeyFor(studio.accountKind, studio.role), status: 'completed', currentStep: 0 })
  }
  return ok({
    tourKey: data.tour_key as 'tatuador' | 'estudio',
    status: data.status as TourProgressState['status'],
    currentStep: data.current_step,
  })
}

/** Guarda en qué paso va (llamado en cada "Siguiente"/"Atrás" para poder
 * continuar donde quedó si cierra la app). */
export async function advanceTourProgress(step: number): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { error } = await admin
    .from('tour_progress')
    .upsert(
      {
        artist_id: studio.artistId,
        tour_key: tourKeyFor(studio.accountKind, studio.role),
        status: 'in_progress',
        current_step: step,
      },
      { onConflict: 'artist_id' }
    )
  if (error) return dbError(error)
  return ok(undefined)
}

async function setTourStatus(status: 'completed' | 'skipped'): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { error } = await admin
    .from('tour_progress')
    .upsert(
      { artist_id: studio.artistId, tour_key: tourKeyFor(studio.accountKind, studio.role), status, current_step: 0 },
      { onConflict: 'artist_id' }
    )
  if (error) return dbError(error)
  return ok(undefined)
}

/** Botón "Omitir" o última pantalla ("Finalización"). */
export async function skipTourProgress(): Promise<Result<void>> {
  return setTourStatus('skipped')
}
export async function finishTourProgress(): Promise<Result<void>> {
  return setTourStatus('completed')
}

/** Ajustes → Ayuda → "Repetir tutorial": vuelve a dejarlo en el paso 0. El
 * componente lo abre directo en memoria (no depende de que este cambio de
 * estado se refleje antes de mostrar el primer paso). */
export async function restartTourProgress(): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const { error } = await admin
    .from('tour_progress')
    .upsert(
      {
        artist_id: studio.artistId,
        tour_key: tourKeyFor(studio.accountKind, studio.role),
        status: 'in_progress',
        current_step: 0,
      },
      { onConflict: 'artist_id' }
    )
  if (error) return dbError(error)
  return ok(undefined)
}
