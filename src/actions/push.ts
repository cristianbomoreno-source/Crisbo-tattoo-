'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

/** Guarda (o actualiza) la suscripción push de este navegador, ligada al
 * artista/estudio de la sesión actual. Upsert por `endpoint`: llamar esto
 * en cada carga con permiso ya concedido no duplica nada. */
export async function subscribeToPushAction(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<Result<void>> {
  const supabase = await createClient()
  const { data: artist } = await supabase.from('artists').select('id, studio_id').single()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      studio_id: artist.studio_id,
      artist_id: artist.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: 'endpoint' }
  )
  if (error) return dbError(error)
  return ok(undefined)
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<Result<void>> {
  const supabase = await createClient()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return dbError(error)
  return ok(undefined)
}
