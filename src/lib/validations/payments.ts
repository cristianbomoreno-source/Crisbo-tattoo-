import { z } from 'zod'

export const createPaymentSchema = z.object({
  project_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  payment_method: z.string().trim().min(1).max(40).optional(),
  notes: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
