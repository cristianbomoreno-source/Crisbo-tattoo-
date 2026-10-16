'use server'

import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ownsRow } from '@/lib/authz'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import {
  createConsentLinkSchema,
  submitConsentSchema,
} from '@/lib/validations/consent-links'
import { medicalAlertDetails } from '@/lib/consents/consent-fields'
import { finalizeSignedConsent } from '@/lib/consents/sign'

const EXPIRY_HOURS = 48

async function getStudioId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('studio_id').single()
  return data?.studio_id ?? null
}

/** Estudio: genera un link tokenizado (expira en 48 h). */
export async function createConsentLinkAction(
  input: unknown
): Promise<Result<{ token: string }>> {
  const parsed = createConsentLinkSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studioId = await getStudioId()
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  // Evita links apuntando a proyectos/clientes de otro estudio (la página
  // pública revelaría el nombre del cliente ajeno).
  const [okProject, okClient, okTemplate] = await Promise.all([
    ownsRow('projects', parsed.data.project_id),
    ownsRow('clients', parsed.data.client_id),
    parsed.data.template_id
      ? ownsRow('consent_templates', parsed.data.template_id)
      : Promise.resolve(true),
  ])
  if (!okProject || !okClient || !okTemplate)
    return err('NOT_FOUND', 'Proyecto, cliente o plantilla no encontrado')

  // Un proyecto con consentimiento ya firmado no puede generar otro por
  // encima — hay que borrar el existente primero (deleteConsentAction).
  const supabaseCheck = await createClient()
  const { data: existingConsent } = await supabaseCheck
    .from('consents')
    .select('id')
    .eq('project_id', parsed.data.project_id)
    .maybeSingle()
  if (existingConsent)
    return err(
      'VALIDATION_ERROR',
      'Este proyecto ya tiene un consentimiento firmado. Bórralo desde Consentimientos si necesitas generar uno nuevo.'
    )

  const token = randomBytes(32).toString('base64url')
  const expires_at = new Date(Date.now() + EXPIRY_HOURS * 3_600_000).toISOString()

  const supabase = await createClient()
  const { error } = await supabase.from('consent_links').insert({
    studio_id: studioId,
    project_id: parsed.data.project_id,
    client_id: parsed.data.client_id,
    template_id: parsed.data.template_id ?? null,
    token,
    status: 'pending',
    expires_at,
  })
  if (error) return dbError(error)

  revalidatePath(`/dashboard/projects/${parsed.data.project_id}`)
  return ok({ token })
}

/** Público (service-role): valida el token y guarda la firma + campos. */
export async function submitSignedConsentAction(
  input: unknown
): Promise<Result<void>> {
  try {
    return await submitSignedConsentInner(input)
  } catch (e) {
    // Red de seguridad: cualquier excepción inesperada aquí antes dejaba el
    // botón "Firmar y confirmar" cargando para siempre (la promesa nunca
    // resolvía en el cliente). Ahora siempre vuelve un Result.
    console.error('[consent-links] submitSignedConsentAction falló', e)
    return err('DB_ERROR', 'No se pudo guardar el consentimiento. Intenta de nuevo.')
  }
}

async function submitSignedConsentInner(input: unknown): Promise<Result<void>> {
  const parsed = submitConsentSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)
  const { token, signature_data, ...form } = parsed.data

  const admin = createAdminClient()
  const { data: link, error } = await admin
    .from('consent_links')
    .select('id, studio_id, project_id, client_id, template_id, status, expires_at')
    .eq('token', token)
    .maybeSingle()
  if (error) return dbError(error)
  if (!link) return err('NOT_FOUND', 'Enlace no encontrado')
  if (link.status !== 'pending')
    return err('VALIDATION_ERROR', 'Este enlace ya no está disponible')
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now())
    return err('VALIDATION_ERROR', 'El enlace expiró')

  const h = await headers()
  return finalizeSignedConsent(createAdminClient(), link, {
    form: form as Record<string, unknown>,
    signatureData: signature_data,
    signerIp: (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null,
    signerUserAgent: h.get('user-agent') ?? null,
  })
}

/** Estudio: revoca un link pendiente (no se puede re-firmar uno ya firmado). */
export async function revokeConsentLinkAction(
  id: string,
  projectId: string
): Promise<Result<void>> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('consent_links')
    .update({ status: 'revoked' })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) return dbError(error)

  revalidatePath(`/dashboard/projects/${projectId}`)
  return ok(undefined)
}

/** Estudio: borra un consentimiento firmado (y el link que quedó apuntando
 * a él). El proyecto vuelve a quedar sin consentimiento firmado, así que
 * "Iniciar sesión" se bloquea de nuevo y se puede generar uno nuevo. */
export async function deleteConsentAction(consentId: string): Promise<Result<void>> {
  const owned = await ownsRow('consents', consentId)
  if (!owned) return err('NOT_FOUND', 'Consentimiento no encontrado')

  const supabase = await createClient()
  const { data: consent, error: fetchErr } = await supabase
    .from('consents')
    .select('project_id')
    .eq('id', consentId)
    .maybeSingle()
  if (fetchErr) return dbError(fetchErr)

  // 1) El link apunta al consentimiento (consent_id, FK sin cascada) — hay
  //    que borrarlo primero o la fila de `consents` no se puede eliminar.
  const { error: linkErr } = await supabase
    .from('consent_links')
    .delete()
    .eq('consent_id', consentId)
  if (linkErr) return dbError(linkErr)

  const { error } = await supabase.from('consents').delete().eq('id', consentId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/consents')
  revalidatePath('/dashboard')
  if (consent?.project_id) revalidatePath(`/dashboard/projects/${consent.project_id}`)
  return ok(undefined)
}

/** Lee SOLO las respuestas de salud marcadas "Sí" (con su explicación) de
 * los consentimientos firmados de un proyecto que dispararon la alerta
 * médica. RLS de `consent_links` ya restringe esto al tatuador asignado o
 * al dueño del estudio — nadie más puede llamar esto y obtener datos. */
export async function getMedicalAlertDetailsAction(
  projectId: string
): Promise<Result<{ label: string; detail: string }[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consent_links')
    .select('form_data')
    .eq('project_id', projectId)
    .eq('has_medical_alert', true)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return dbError(error)
  if (!data) return ok([])
  return ok(medicalAlertDetails(data.form_data as Record<string, unknown> | null))
}
