import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type Consent = {
  id: string
  studio_id: string
  project_id: string
  client_id: string
  template_id: string | null
  signature_data: string | null
  pdf_url: string | null
  signed_at: string | null
  created_at: string
}

export type ConsentTemplate = {
  id: string
  studio_id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type ConsentWithRelations = Consent & {
  projects: { name: string } | null
  clients: { name: string } | null
  // El link que quedó apuntando a este consentimiento (consent_links.consent_id
  // -> consents.id) — su id arma la URL del PDF (/api/consent-links/{id}/pdf).
  consent_links: { id: string }[] | null
}

export async function getConsents(): Promise<Result<ConsentWithRelations[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consents')
    .select('*, projects(name), clients(name), consent_links!consent_links_consent_id_fkey(id)')
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return ok(data as ConsentWithRelations[])
}

export async function getConsentTemplates(): Promise<Result<ConsentTemplate[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consent_templates')
    .select('*')
    .order('name')

  if (error) return dbError(error)
  return ok(data as ConsentTemplate[])
}

export async function getSignedConsentsByClient(
  clientId: string
): Promise<Result<ConsentWithRelations[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consents')
    .select('*, projects(name), clients(name)')
    .eq('client_id', clientId)
    .not('signed_at', 'is', null)
    .order('signed_at', { ascending: false })

  if (error) return dbError(error)
  return ok(data as ConsentWithRelations[])
}

/** Proyectos (de la lista dada) que ya tienen un consentimiento firmado —
 * para bloquear "Iniciar sesión" hasta que exista uno. */
export async function getProjectIdsWithSignedConsent(
  projectIds: string[]
): Promise<Set<string>> {
  if (projectIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consents')
    .select('project_id')
    .in('project_id', projectIds)
    .not('signed_at', 'is', null)
  if (error || !data) return new Set()
  return new Set(data.map((r) => r.project_id).filter((id): id is string => !!id))
}
