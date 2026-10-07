'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'

/**
 * Elimina la cuenta OFINK activa (ver src/actions/accounts.ts — cada
 * usuario puede tener hasta 2: 'tatuador' y 'estudio').
 *
 * - Dueño de estudio: borra el estudio completo. Todas las tablas
 *   dependientes tienen `studio_id` con `ON DELETE CASCADE` (verificado en
 *   el esquema real), así que un solo `delete` en `studios` se lleva todo
 *   (proyectos, clientes, cotizaciones, pagos, citas, galería, enlaces...).
 * - Miembro de un estudio ajeno: borra solo su fila de `artists`. Si esa
 *   cuenta ya generó clientes/proyectos/cotizaciones/sesiones/galería
 *   propios, la base de datos rechaza el borrado (esas tablas NO cascadean
 *   desde `artists`, a propósito, para no perder el trabajo del estudio) —
 *   se le pide entonces que el dueño lo quite desde Equipo.
 *
 * Si tras esto la persona se queda sin ninguna cuenta OFINK, también se
 * borra su usuario de Supabase Auth por completo (ya no le queda nada que
 * proteger con ese login) y se cierra la sesión.
 */
export async function deleteMyAccount(): Promise<Result<{ fullyDeleted: boolean }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()

  if (studio.role === 'owner') {
    const { error } = await admin.from('studios').delete().eq('id', studio.id)
    if (error) return err('DB_ERROR', 'No se pudo eliminar el estudio. Intenta de nuevo.')
  } else {
    const { error } = await admin.from('artists').delete().eq('id', studio.artistId)
    if (error) {
      return err(
        'DB_ERROR',
        'No pudimos eliminar tu cuenta: ya generaste clientes, proyectos o cotizaciones en este estudio. Pide al dueño que te quite del equipo desde Ajustes → Equipo.'
      )
    }
  }

  const { data: remaining } = await supabase.rpc('list_my_accounts')
  const fullyDeleted = !remaining || remaining.length === 0

  if (fullyDeleted) {
    await admin.auth.admin.deleteUser(user.id)
  }

  await supabase.auth.signOut()
  return ok({ fullyDeleted })
}
