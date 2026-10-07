import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type ConsentLinkStatus = 'pending' | 'signed' | 'revoked'

export type ConsentLink = {
  id: string
  project_id: string
  client_id: string
  template_id: string | null
  token: string
  status: ConsentLinkStatus
  form_data: Record<string, unknown> | null
  signature_data: string | null
  signed_at: string | null
  expires_at: string | null
  created_at: string
  has_medical_alert: boolean
}

/** Authed: links de un proyecto (para el estudio). */
export async function getConsentLinksByProject(
  projectId: string
): Promise<Result<ConsentLink[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consent_links')
    .select(
      'id, project_id, client_id, template_id, token, status, form_data, signature_data, signed_at, expires_at, created_at, has_medical_alert'
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) return dbError(error)
  return ok(data as ConsentLink[])
}

/** Proyectos (de la lista dada) que tienen al menos un consentimiento
 * firmado con alerta médica — para insignias en agenda/sesiones de hoy.
 * RLS ya filtra a solo lo que el tatuador actual puede ver (asignado o
 * dueño), así que el resultado nunca expone alertas de otros. */
export async function getProjectIdsWithMedicalAlert(
  projectIds: string[]
): Promise<Set<string>> {
  if (projectIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consent_links')
    .select('project_id')
    .in('project_id', projectIds)
    .eq('has_medical_alert', true)
  if (error || !data) return new Set()
  return new Set(data.map((r) => r.project_id).filter((id): id is string => !!id))
}

export type PublicConsentClient = {
  name: string
  phone: string | null
  email: string | null
  birthdate: string | null
  documentType: string | null
  documentNumber: string | null
  address: string | null
}

export type PublicConsentProject = {
  name: string
  bodyZone: string | null
  description: string | null
  size: string | null
  sessionCount: number | null
  avgSessionDuration: string | null
  totalValue: number | null
  photoUrl: string | null
  artistName: string | null
  nextSessionAt: string | null
  nextSessionDurationMinutes: number | null
}

export type PublicConsentLink = {
  status: ConsentLinkStatus
  expired: boolean
  studioName: string
  clientName: string
  templateName: string | null
  templateContent: string | null
  client: PublicConsentClient
  project: PublicConsentProject | null
}

/** Público (service-role): datos mínimos para renderizar el formulario por token. */
export async function getPublicConsentLink(
  token: string
): Promise<Result<PublicConsentLink>> {
  const admin = createAdminClient()
  const { data: link, error } = await admin
    .from('consent_links')
    .select('status, expires_at, studio_id, client_id, project_id, template_id')
    .eq('token', token)
    .maybeSingle()
  if (error) return dbError(error)
  if (!link) return err('NOT_FOUND', 'Enlace no encontrado')

  const expired = link.expires_at
    ? new Date(link.expires_at).getTime() < Date.now()
    : false

  const [studioRes, clientRes, tplRes, projectRes] = await Promise.all([
    admin.from('studios').select('name').eq('id', link.studio_id).maybeSingle(),
    admin
      .from('clients')
      .select('name, phone, email, birthdate, document_type, document_number, address')
      .eq('id', link.client_id)
      .maybeSingle(),
    link.template_id
      ? admin
          .from('consent_templates')
          .select('name, content')
          .eq('id', link.template_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    link.project_id
      ? admin
          .from('projects')
          .select(
            'name, session_count, total_value, artist_id, quote_id, artists(name), quotes(body_zone, description, size, avg_session_duration), gallery(url, sort_order), sessions(scheduled_at, duration_minutes, status)'
          )
          .eq('id', link.project_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const tpl = tplRes.data as { name?: string; content?: string } | null
  const client = clientRes.data as {
    name: string
    phone: string | null
    email: string | null
    birthdate: string | null
    document_type: string | null
    document_number: string | null
    address: string | null
  } | null

  const proj = projectRes.data as {
    name: string
    session_count: number | null
    total_value: number | null
    artists: { name: string } | null
    quotes: { body_zone: string | null; description: string | null; size: string | null; avg_session_duration: string | null } | null
    gallery: { url: string; sort_order: number }[] | null
    sessions: { scheduled_at: string; duration_minutes: number | null; status: string }[] | null
  } | null

  let project: PublicConsentProject | null = null
  if (proj) {
    const photo = [...(proj.gallery ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
    const upcoming = (proj.sessions ?? [])
      .filter((s) => s.status !== 'cancelled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
    project = {
      name: proj.name,
      bodyZone: proj.quotes?.body_zone ?? null,
      description: proj.quotes?.description ?? null,
      size: proj.quotes?.size ?? null,
      sessionCount: proj.session_count,
      avgSessionDuration: proj.quotes?.avg_session_duration ?? null,
      totalValue: proj.total_value,
      photoUrl: photo?.url ?? null,
      artistName: proj.artists?.name ?? null,
      nextSessionAt: upcoming?.scheduled_at ?? null,
      nextSessionDurationMinutes: upcoming?.duration_minutes ?? null,
    }
  }

  return ok({
    status: link.status as ConsentLinkStatus,
    expired,
    studioName: studioRes.data?.name ?? 'Estudio',
    clientName: client?.name ?? '',
    templateName: tpl?.name ?? null,
    templateContent: tpl?.content ?? null,
    client: {
      name: client?.name ?? '',
      phone: client?.phone ?? null,
      email: client?.email ?? null,
      birthdate: client?.birthdate ?? null,
      documentType: client?.document_type ?? null,
      documentNumber: client?.document_number ?? null,
      address: client?.address ?? null,
    },
    project,
  })
}

export type ConsentLinkForPdf = {
  id: string
  status: ConsentLinkStatus
  /** Para verificar pertenencia en la ruta del PDF (defensa en profundidad sobre RLS). */
  studioId: string
  formData: Record<string, unknown> | null
  signatureData: string | null
  signedAt: string | null
  signerIp: string | null
  studioName: string
  clientName: string
  projectName: string
  templateName: string | null
  templateContent: string | null
}

/** Authed (RLS studio_isolation): un link con todo lo necesario para el PDF.
 * Incluye la plantilla (texto legal) y los nombres de estudio/cliente/proyecto. */
export async function getConsentLinkForPdf(id: string): Promise<Result<ConsentLinkForPdf>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consent_links')
    .select(
      'id, status, studio_id, form_data, signature_data, signed_at, signer_ip, studios(name), clients(name), projects(name), consent_templates(name, content)'
    )
    .eq('id', id)
    .maybeSingle()
  if (error) return dbError(error)
  if (!data) return err('NOT_FOUND', 'Consentimiento no encontrado')

  const row = data as unknown as {
    id: string
    status: ConsentLinkStatus
    studio_id: string
    form_data: Record<string, unknown> | null
    signature_data: string | null
    signed_at: string | null
    signer_ip: string | null
    studios: { name: string } | null
    clients: { name: string } | null
    projects: { name: string } | null
    consent_templates: { name: string; content: string } | null
  }

  return ok({
    id: row.id,
    status: row.status,
    studioId: row.studio_id,
    formData: row.form_data,
    signatureData: row.signature_data,
    signedAt: row.signed_at,
    signerIp: row.signer_ip,
    studioName: row.studios?.name ?? 'Estudio',
    clientName: row.clients?.name ?? '',
    projectName: row.projects?.name ?? '',
    templateName: row.consent_templates?.name ?? null,
    templateContent: row.consent_templates?.content ?? null,
  })
}
