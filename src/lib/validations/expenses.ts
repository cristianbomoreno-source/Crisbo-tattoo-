import { z } from 'zod'

/** Categorías libres: el tatuador escribe la que quiera, sin catálogo fijo
 * — solo se limita el largo para que se vea bien en las tarjetas/gráficas. */
export const createExpenseSchema = z.object({
  category: z.string().trim().min(1, 'Escribe una categoría').max(40),
  description: z.string().trim().max(200).optional(),
  amount: z.coerce.number().min(0, 'El monto no puede ser negativo'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  due_day: z.coerce.number().min(1).max(31).optional().nullable(),
})
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

export const updateExpenseSchema = createExpenseSchema.partial()
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
