import { z } from 'zod'

export const createProjectSchema = z.object({
  client_id: z.string().uuid('Selecciona un cliente'),
  quote_id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  total_value: z.coerce.number().positive().optional(),
  deposit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['quote', 'design', 'approval', 'scheduled', 'in_progress', 'completed']).optional(),
})

export const updateProjectSessionsDepositSchema = z.object({
  session_count: z.coerce.number().int().min(1).optional(),
  deposit_percentage: z.coerce.number().min(0).max(100).optional(),
})

export const updateProjectValueSchema = z.object({
  total_value: z.coerce.number().min(0),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UpdateProjectSessionsDepositInput = z.infer<typeof updateProjectSessionsDepositSchema>
