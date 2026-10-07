import { z } from 'zod'

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(60),
  category: z.string().trim().max(40).optional(),
  quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa'),
  unit: z.string().trim().min(1).max(20).default('unidades'),
  min_stock: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(300).optional(),
})
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>

export const updateInventoryQuantitySchema = z.object({
  quantity: z.coerce.number().min(0),
})

/** Mínimo por sesión + costo unitario (Ajustes → Inventario, fila de cada
 * insumo) — precargan y valoran el popup de materiales al iniciar una sesión. */
export const updateInventoryDefaultsSchema = z.object({
  default_qty_per_session: z.coerce.number().min(0),
  unit_cost: z.coerce.number().min(0).nullable().optional(),
})
export type UpdateInventoryDefaultsInput = z.infer<typeof updateInventoryDefaultsSchema>

/** Categoría personalizada de inventario (ícono + color) — tabla nueva y
 * aparte de `inventory_items`. Se guarda una vez y se reutiliza por nombre. */
export const createInventoryCategorySchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(40),
  icon: z.string().trim().min(1).max(30),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido'),
})
export type CreateInventoryCategoryInput = z.infer<typeof createInventoryCategorySchema>

/** Materiales confirmados al iniciar una sesión puntual — un array con al
 * menos el insumo y la cantidad realmente gastada (puede ser 0, editable
 * respecto al mínimo configurado). */
export const startSessionMaterialsSchema = z.object({
  sessionId: z.string().uuid(),
  materials: z
    .array(
      z.object({
        inventoryItemId: z.string().uuid(),
        quantity: z.coerce.number().min(0),
      })
    )
    .default([]),
})
export type StartSessionMaterialsInput = z.infer<typeof startSessionMaterialsSchema>
