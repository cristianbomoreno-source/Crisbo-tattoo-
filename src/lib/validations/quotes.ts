import { z } from 'zod'

export const createQuoteSchema = z.object({
  client_id: z.string().uuid('Selecciona un cliente'),
  body_zone: z.string().optional(),
  style: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  is_courtesy: z.coerce.boolean().default(false),
  session_count: z.coerce.number().int().min(1).optional(),
  avg_session_duration: z.string().optional(),
  deposit_percentage: z.coerce.number().min(0).max(100).default(20),
  notes: z.string().optional(),
  size: z.string().max(60).optional(),
  color: z.string().max(20).optional(),
  skin_tone: z.string().max(30).optional(),
  service: z.string().max(40).optional(),
})

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['new', 'reviewed', 'quoted', 'approved', 'rejected']).optional(),
})

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>
