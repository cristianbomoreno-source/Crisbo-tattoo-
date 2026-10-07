'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'
import { TOTAL_FEATURES } from '@/lib/feedback/features'

export type MyFeedbackEntry = { rating: number; comment: string | null }

/** Mis calificaciones ya guardadas, indexadas por `feature_key` — para
 * prellenar la página de calificación y calcular el progreso del banner. */
export async function getMyFeedback(): Promise<Result<Record<string, MyFeedbackEntry>>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const { data, error } = await supabase
    .from('feature_feedback')
    .select('feature_key, rating, comment')
    .eq('user_id', user.id)
  if (error) return dbError(error)

  const map: Record<string, MyFeedbackEntry> = {}
  for (const row of data ?? []) {
    map[row.feature_key] = { rating: row.rating, comment: row.comment }
  }
  return ok(map)
}

/** Progreso (cuántas de las funciones totales ya calificó) — alimenta el
 * mensaje/banner de Ajustes. */
export async function getMyFeedbackProgress(): Promise<Result<{ rated: number; total: number }>> {
  const result = await getMyFeedback()
  if (!result.success) return result
  return ok({ rated: Object.keys(result.data).length, total: TOTAL_FEATURES })
}

/** Guarda (crea o actualiza) la calificación de una función puntual —
 * autosave apenas se toca una estrella, sin botón "guardar" aparte. */
export async function rateFeature(
  featureKey: string,
  rating: number,
  comment?: string
): Promise<Result<void>> {
  if (!featureKey) return err('VALIDATION_ERROR', 'Función inválida')
  if (rating < 1 || rating > 5) return err('VALIDATION_ERROR', 'Calificación inválida')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const studio = await getCurrentStudio()

  const { error } = await supabase.from('feature_feedback').upsert(
    {
      user_id: user.id,
      artist_id: studio?.artistId ?? null,
      studio_id: studio?.id ?? null,
      feature_key: featureKey,
      rating,
      comment: comment?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,feature_key' }
  )
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/settings/feedback')
  return ok(undefined)
}
