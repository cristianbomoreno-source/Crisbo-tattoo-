import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  instagram: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
