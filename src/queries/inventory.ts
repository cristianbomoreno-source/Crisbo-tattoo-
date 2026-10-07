import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type InventoryItem = {
  id: string
  name: string
  category: string | null
  quantity: number
  unit: string
  min_stock: number | null
  notes: string | null
  updated_at: string
  /** Mínimo configurable de cuánto se gasta de este insumo por sesión —
   * precarga el popup de materiales al iniciar una sesión (Home). */
  default_qty_per_session: number
  /** Costo por unidad, opcional — si está, permite calcular el valor exacto
   * de materiales gastados en una sesión. Si es null, esa fila no suma al total. */
  unit_cost: number | null
}

export async function getInventoryItems(): Promise<Result<InventoryItem[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, quantity, unit, min_stock, notes, updated_at, default_qty_per_session, unit_cost')
    .order('name', { ascending: true })

  if (error) return dbError(error)
  return ok(data as InventoryItem[])
}

/** Categoría personalizada (ícono + color) — tabla nueva y aparte de
 * `inventory_items` (que sigue con `category` como texto libre sin FK).
 * Se guarda por nombre y se reutiliza en toda la app buscándola por ese
 * nombre; el emoji/color quedan siempre asociados a esa categoría. */
export type InventoryCategory = {
  id: string
  name: string
  icon: string
  color: string
}

export async function getInventoryCategories(): Promise<Result<InventoryCategory[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('id, name, icon, color')
    .order('name', { ascending: true })

  if (error) return dbError(error)
  return ok(data as InventoryCategory[])
}
