'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentPermissions } from '@/queries/permissions'
import { getProjectsByClient, type ProjectSummary } from '@/queries/projects'
import { cleanTags, lostTag, LOST_TAG_PREFIX } from '@/lib/crm/options'
import { isContactGroup, saveContactGroup } from '@/lib/crm/contact-groups'
import { createAdminClient } from '@/lib/supabase/admin'

export type ClientCrm = {
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
    instagram: string | null
    notes: string | null
    source: string | null
    tags: string[]
    created_at: string
  }
  projects: ProjectSummary[]
  quotes: { id: string; status: string; price: number | null; style: string | null; body_zone: string | null; created_at: string }[]
}

/** Ficha del cliente para el panel del chat: datos, proyectos (con pagos y
 * citas) y cotizaciones. */
export async function getClientCrmAction(clientId: string): Promise<Result<ClientCrm>> {
  const supabase = await createClient()
  const [clientRes, projectsRes, quotesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, phone, email, instagram, notes, source, preferred_services, created_at')
      .eq('id', clientId)
      .maybeSingle(),
    getProjectsByClient(clientId),
    supabase
      .from('quotes')
      .select('id, status, price, style, body_zone, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])
  if (clientRes.error) return dbError(clientRes.error)
  if (!clientRes.data) return err('NOT_FOUND', 'Cliente no encontrado')
  const { preferred_services, ...client } = clientRes.data as ClientCrm['client'] & { preferred_services: string[] | null }
  return ok({
    client: { ...client, tags: preferred_services ?? [] },
    projects: projectsRes.success ? projectsRes.data : [],
    quotes: (quotesRes.data ?? []) as ClientCrm['quotes'],
  })
}

const crmSchema = z.object({
  notes: z.string().max(2000).optional(),
  source: z.string().max(40).nullable().optional(),
  tags: z.array(z.string()).max(20).optional(),
})

/** Guarda notas, origen y etiquetas del cliente (columnas notes, source y
 * preferred_services de `clients`, ver lib/crm/options.ts). */
export async function updateClientCrmAction(clientId: string, input: unknown): Promise<Result<null>> {
  const parsed = crmSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_edit_clients) return err('FORBIDDEN', 'No tienes permiso para editar clientes')

  const { notes, source, tags } = parsed.data
  const update: Record<string, unknown> = {}
  if (notes !== undefined) update.notes = notes.trim() || null
  if (source !== undefined) update.source = source?.trim() || null
  if (tags !== undefined) update.preferred_services = cleanTags(tags)
  if (Object.keys(update).length === 0) return ok(null)

  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(update).eq('id', clientId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox', 'layout')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return ok(null)
}

/** Marca el lead como perdido y, si el chat tiene cliente, guarda el motivo
 * como etiqueta "Perdido · <motivo>" (reemplaza un motivo anterior). */
export async function markLeadLostAction(conversationId: string, clientId: string | null, reason: string): Promise<Result<null>> {
  const why = reason.trim().slice(0, 30)
  const supabase = await createClient()
  const { error } = await supabase
    .from('wa_conversations')
    .update({ lead_stage: 'perdido', lead_stage_at: new Date().toISOString(), follow_up_at: null })
    .eq('id', conversationId)
  if (error) return dbError(error)

  if (clientId && why) {
    const { data } = await supabase.from('clients').select('preferred_services').eq('id', clientId).maybeSingle()
    const prev = ((data?.preferred_services as string[] | null) ?? []).filter((t) => !t.startsWith(LOST_TAG_PREFIX))
    await supabase.from('clients').update({ preferred_services: cleanTags([...prev, lostTag(why)]) }).eq('id', clientId)
  }
  revalidatePath('/dashboard/inbox', 'layout')
  return ok(null)
}

/** Mueve un chat a "Personal" (familia, amigos, contador…) o lo devuelve a
 * clientes (`group = null`). Ver lib/crm/contact-groups.ts. */
export async function setContactGroupAction(conversationId: string, group: string | null): Promise<Result<null>> {
  if (group !== null && !isContactGroup(group)) return err('VALIDATION_ERROR', 'Grupo no válido')
  // Con RLS: solo se encuentra si el chat es del estudio activo.
  const supabase = await createClient()
  const { data: conv, error } = await supabase.from('wa_conversations').select('id, studio_id').eq('id', conversationId).maybeSingle()
  if (error) return dbError(error)
  if (!conv) return err('NOT_FOUND', 'Chat no encontrado')
  try {
    await saveContactGroup(createAdminClient(), conv.studio_id as string, conversationId, group)
  } catch (e) {
    return err('UNKNOWN_ERROR', (e as Error).message)
  }
  revalidatePath('/dashboard/inbox', 'layout')
  return ok(null)
}
