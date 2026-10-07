'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { startSessionMaterialsSchema } from '@/lib/validations/inventory'
import { revalidatePath } from 'next/cache'

/** Confirma los materiales gastados en una cita puntual y arranca su
 * cronómetro (botón ▶ en "Próxima sesión"/lista de citas de hoy):
 * 1) registra cada insumo con cantidad > 0 en `session_materials` (con el
 *    costo unitario de ese momento, para que el valor quede fijo aunque el
 *    costo del insumo cambie después),
 * 2) descuenta esa cantidad del stock del insumo (salida de inventario),
 * 3) abre el `work_shift` atado a `session_id`.
 * Sin transacción real (Supabase JS no la da desde el cliente): si algo
 * falla a mitad de camino, lo hecho hasta ahí queda — es preferible a
 * bloquear el inicio de la sesión por un problema de inventario. */
export async function startSessionWithMaterials(
  input: unknown
): Promise<Result<{ shiftId: string; startedAt: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const parsed = startSessionMaterialsSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)
  const { sessionId, materials } = parsed.data

  const supabase = await createClient()
  const used = materials.filter((m) => m.quantity > 0)

  if (used.length > 0) {
    const ids = used.map((m) => m.inventoryItemId)
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, quantity, unit_cost')
      .in('id', ids)
    if (itemsError) return dbError(itemsError)

    const byId = new Map((items ?? []).map((i) => [i.id, i]))
    const rows = used.map((m) => ({
      studio_id: studio.id,
      session_id: sessionId,
      inventory_item_id: m.inventoryItemId,
      quantity: m.quantity,
      unit_cost: byId.get(m.inventoryItemId)?.unit_cost ?? null,
    }))

    const { error: insertError } = await supabase.from('session_materials').insert(rows)
    if (insertError) return dbError(insertError)

    // Descuenta stock uno por uno (no hay UPDATE ... SET qty = qty - x
    // atómico simple vía supabase-js sin RPC) — se ignoran fallas puntuales
    // para no tumbar el arranque de la sesión por un insumo puntual.
    for (const m of used) {
      const current = byId.get(m.inventoryItemId)
      if (!current) continue
      const next = Math.max(0, Number(current.quantity) - m.quantity)
      await supabase
        .from('inventory_items')
        .update({ quantity: next, updated_at: new Date().toISOString() })
        .eq('id', m.inventoryItemId)
        .eq('studio_id', studio.id)
    }
  }

  const { data: shift, error: shiftError } = await supabase
    .from('work_shifts')
    .insert({ studio_id: studio.id, artist_id: studio.artistId, session_id: sessionId })
    .select('id, started_at')
    .single()
  if (shiftError) return dbError(shiftError)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings/inventario')
  return ok({ shiftId: shift.id, startedAt: shift.started_at })
}

/** Cierra el cronómetro de una cita puntual (o de la jornada general si no
 * está atado a ninguna sesión — misma tabla, mismo mecanismo). Si SÍ está
 * atado a una sesión (`session_id`), suma el tiempo realmente transcurrido
 * a `projects.worked_minutes` del proyecto de esa sesión — así queda el
 * tiempo ejecutado real, aparte de `duration_minutes` (el estimado al
 * agendar). Sin transacción real: si el paso de sumar al proyecto falla,
 * el cronómetro igual queda cerrado — es preferible a que la sesión se
 * quede "corriendo" para siempre por un problema aparte. */
export async function endSessionShift(shiftId: string): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const endedAt = new Date()
  const { data: shift, error } = await supabase
    .from('work_shifts')
    .update({ ended_at: endedAt.toISOString() })
    .eq('id', shiftId)
    .eq('artist_id', studio.artistId)
    .is('ended_at', null)
    .select('started_at, session_id')
    .maybeSingle()
  if (error) return dbError(error)

  if (shift?.session_id) {
    const elapsedMinutes = Math.max(
      0,
      Math.round((endedAt.getTime() - new Date(shift.started_at).getTime()) / 60000)
    )
    if (elapsedMinutes > 0) {
      const { data: session } = await supabase
        .from('sessions')
        .select('project_id')
        .eq('id', shift.session_id)
        .maybeSingle()
      if (session?.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('worked_minutes')
          .eq('id', session.project_id)
          .maybeSingle()
        await supabase
          .from('projects')
          .update({ worked_minutes: (project?.worked_minutes ?? 0) + elapsedMinutes })
          .eq('id', session.project_id)
        revalidatePath(`/dashboard/projects/${session.project_id}`)
      }
    }
  }

  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}
