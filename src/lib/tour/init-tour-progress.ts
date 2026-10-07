import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type AdminClient = SupabaseClient<Database>

/**
 * Inserta la fila inicial de `tour_progress` ('pending') para una cuenta
 * (`artists.id`) recién creada — así el tutorial guiado (`GuidedTour`)
 * se auto-abre la primera vez que esa cuenta entra al dashboard, y NUNCA
 * para cuentas que ya existían antes de este feature (esas se dejaron en
 * 'completed' en la migración de backfill).
 *
 * `tourKey` se decide una sola vez, aquí, según el tipo de Home que esa
 * cuenta ve: dueños de estudio → recorrido 'estudio'; tatuadores
 * independientes y colaboradores (members) → recorrido 'tatuador' (ven el
 * Home normal, no el dashboard de dueño).
 *
 * Llamada desde los 4 puntos donde se crea una fila `artists` nueva:
 * `completeProfileStep` (tatuador), `createStudioOnboarding` (estudio),
 * y las dos altas de colaborador (`collaborators.ts`, `team.ts`) — todas
 * usan el cliente admin porque `artists`/`tour_progress` no exponen
 * escritura a `authenticated`. No lanza si falla: el peor caso es que el
 * tour no se auto-abra, nunca debe tumbar la creación de la cuenta.
 */
export async function initTourProgress(
  admin: AdminClient,
  artistId: string,
  tourKey: 'tatuador' | 'estudio'
): Promise<void> {
  try {
    await admin
      .from('tour_progress')
      .insert({ artist_id: artistId, tour_key: tourKey, status: 'pending', current_step: 0 })
  } catch {
    // Silencioso a propósito — ver nota arriba.
  }
}
