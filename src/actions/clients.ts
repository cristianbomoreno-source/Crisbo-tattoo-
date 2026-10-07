'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createClientSchema, updateClientSchema } from '@/lib/validations/clients'
import { revalidatePath } from 'next/cache'
import type { Client } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { getCurrentPermissions } from '@/queries/permissions'

export async function createClientAction(input: unknown): Promise<Result<Client>> {
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_create_clients)
    return err('FORBIDDEN', 'No tienes permiso para crear clientes')

  // El owner deja artist_id null (cliente visible a todo el estudio, mismo
  // comportamiento de siempre); un member queda dueño de su propio cliente.
  const artistId = studio.role === 'owner' ? null : studio.artistId

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...parsed.data, studio_id: studio.id, artist_id: artistId })
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard/clients')
  return ok(data as Client)
}

export async function updateClientAction(id: string, input: unknown): Promise<Result<Client>> {
  const parsed = updateClientSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_clients)
    return err('FORBIDDEN', 'No tienes permiso para editar clientes')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return ok(data as Client)
}

/** Importa contactos del teléfono (Contact Picker API, ver phone-contacts-import.tsx).
 * Omite silenciosamente los que ya existen por teléfono, para poder repetir la
 * importación sin duplicar clientes. */
export async function bulkCreateClientsAction(
  contacts: { name: string; phone?: string }[]
): Promise<Result<{ created: number; skipped: number }>> {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return err('VALIDATION_ERROR', 'No se recibieron contactos')
  }

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  const studioId = studio.id

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('clients')
    .select('phone')
    .eq('studio_id', studioId)
  const existingPhones = new Set((existing ?? []).map((c) => c.phone).filter(Boolean))

  const rows = contacts
    .filter((c) => c.name?.trim())
    .filter((c) => !c.phone || !existingPhones.has(c.phone))
    .map((c) => ({ studio_id: studioId, name: c.name.trim(), phone: c.phone || null }))

  const skipped = contacts.length - rows.length
  if (rows.length === 0) return ok({ created: 0, skipped })

  const { error } = await supabase.from('clients').insert(rows)
  if (error) return dbError(error)

  revalidatePath('/dashboard/clients')
  return ok({ created: rows.length, skipped })
}

export async function deleteClientAction(id: string): Promise<Result<void>> {
  const supabase = await createClient()

  // quotes.client_id es ON DELETE CASCADE: sin este chequeo, borrar un cliente
  // borraría sus cotizaciones en silencio en vez de avisar y bloquear.
  const { data: quotes } = await supabase.from('quotes').select('id').eq('client_id', id).limit(1)
  if (quotes && quotes.length > 0) {
    return err(
      'VALIDATION_ERROR',
      'No puedes eliminar este cliente: tiene cotizaciones asociadas. Elimínalas primero.'
    )
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) return dbError(error)
  revalidatePath('/dashboard/clients')
  return ok(undefined)
}

/** Busca un cliente del estudio por teléfono (compara los últimos 10 dígitos,
 * para no fallar por indicativo o formato) y trae sus proyectos activos —
 * la usa el popup de "Agendar cita" del calendario para ofrecer reutilizar un
 * proyecto ya existente en vez de crear siempre uno nuevo. */
export async function findClientProjectsByPhoneAction(
  phone: string
): Promise<Result<{ clientId: string; clientName: string; projects: { id: string; name: string }[] } | null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  const studioId = studio.id

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return ok(null)
  const last10 = digits.slice(-10)

  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone')
    .eq('studio_id', studioId)

  const match = (clients ?? []).find(
    (c) => c.phone && c.phone.replace(/\D/g, '').slice(-10) === last10
  )
  if (!match) return ok(null)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('studio_id', studioId)
    .eq('client_id', match.id)
    .neq('status', 'completed')

  return ok({
    clientId: match.id,
    clientName: match.name,
    projects: (projects ?? []).map((p) => ({ id: p.id, name: p.name })),
  })
}
