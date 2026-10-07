import { z } from 'zod'

export const createSessionSchema = z.object({
  project_id: z.string().uuid('Proyecto requerido'),
  scheduled_at: z.string().min(1, 'La fecha es requerida'),
  duration_minutes: z.coerce.number().int().min(5).max(600).default(60),
  notes: z.string().optional(),
})

export const updateSessionSchema = createSessionSchema.partial().extend({
  status: z.enum(['scheduled','completed','rescheduled','cancelled']).optional(),
})

export const rescheduleSessionSchema = z.object({
  scheduled_at: z.string().min(1, 'La fecha es requerida'),
  duration_minutes: z.coerce.number().int().min(5).max(600),
})

export const bulkSessionsSchema = z.object({
  sessions: z
    .array(
      z.object({
        scheduled_at: z.string().min(1, 'La fecha es requerida'),
        duration_minutes: z.coerce.number().int().min(5).max(600),
      })
    )
    .min(1, 'Agrega al menos una sesión'),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type RescheduleSessionInput = z.infer<typeof rescheduleSessionSchema>
