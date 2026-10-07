import { z } from 'zod'

export const blockDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  reason: z.string().optional(),
})

export type BlockDayInput = z.infer<typeof blockDaySchema>
