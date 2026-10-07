'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createInventoryItemSchema, updateInventoryQuantitySchema, updateInventoryDefaultsSchema, createInventoryCategorySchema } from '@/lib/validations/inventory'
import { revalidatePath } from 'next/cache'
import { getCurrentPermissions } from '@/queries/permissions'

async function getArtistAndStudio() {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('id, studio_id').single()
  return data
}

/** Crea un insumo. Categoría y unidad son texto libre — el tatuador arma su
 * propio inventario a su manera, sin catálogo fijo. */
export async function createInventoryItemAction(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createInventoryItemSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_use_inventory)
    return err('FORBIDDEN', 'No tienes permiso para usar el inventario')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ studio_id: artist.studio_id, ...parsed.data })
    .select('id')
    .single()
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/inventario')
  return ok({ id: data.id })
}

/** Ajusta la cantidad de un insumo (+1/-1 desde la lista, o un valor exacto). */
export async function updateInventoryQuantityAction(id: string, input: unknown): Promise<Result<void>> {
  const parsed = updateInventoryQuantitySchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_discount_materials)
    return err('FORBIDDEN', 'No tienes permiso para descontar materiales')

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .update({ quantity: parsed.data.quantity, updated_at: new Date().toISOString() })
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/inventario')
  return ok(undefined)
}

/** Mínimo por sesión + costo unitario de un insumo (fila expandible en
 * Ajustes → Inventario) — lo que precarga y valora el popup de materiales
 * al iniciar una sesión puntual. */
export async function updateInventoryDefaultsAction(id: string, input: unknown): Promise<Result<void>> {
  const parsed = updateInventoryDefaultsSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_inventory)
    return err('FORBIDDEN', 'No tienes permiso para editar el inventario')

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .update({
      default_qty_per_session: parsed.data.default_qty_per_session,
      unit_cost: parsed.data.unit_cost ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/inventario')
  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}

export async function deleteInventoryItemAction(id: string): Promise<Result<void>> {
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_inventory)
    return err('FORBIDDEN', 'No tienes permiso para editar el inventario')

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/inventario')
  return ok(undefined)
}

/** Crea (o actualiza, si ya existe una con ese nombre) una categoría
 * personalizada — tabla nueva y aparte de `inventory_items`, que sigue
 * guardando `category` como texto libre sin cambios. El ícono/color quedan
 * asociados a ese nombre y se reutilizan en toda la app. */
export async function createInventoryCategoryAction(input: unknown): Promise<Result<{ id: string; name: string; icon: string; color: string }>> {
  const parsed = createInventoryCategorySchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_create_inventory_categories)
    return err('FORBIDDEN', 'No tienes permiso para crear categorías')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_categories')
    .upsert(
      { studio_id: artist.studio_id, ...parsed.data },
      { onConflict: 'studio_id,name' }
    )
    .select('id, name, icon, color')
    .single()
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/inventario')
  return ok(data)
}
