import { createClient } from '@/lib/supabase/server'
import type { FeatureKey } from '@/lib/features/catalog'

/** Módulos apagados para el estudio actual (por RLS, cada quien solo ve
 * las filas de su propio `studio_id`). Si una `feature_key` no tiene fila,
 * está encendida por defecto — el admin solo escribe filas para apagar. */
export async function getDisabledFeatures(studioId: string): Promise<Set<FeatureKey>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('studio_features')
    .select('feature_key, enabled')
    .eq('studio_id', studioId)
    .eq('enabled', false)

  return new Set((data ?? []).map((r) => r.feature_key as FeatureKey))
}
