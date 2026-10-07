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
import { hasMedicalAlert, medicalAlertDetails } from '@/lib/consents/consent-fields'
import { sendPushToArtist, sendPushToStudio } from '@/lib/push/send'

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

  const now = new Date().toISOString()
  const h = await headers()
  const signer_ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null
  const signer_user_agent = h.get('user-agent') ?? null
  const medicalAlert = hasMedicalAlert(form as Record<string, unknown>)

  // 1) Reclamar el link PRIMERO (update condicional): dos envíos simultáneos
  //    pasaban ambos el check de 'pending' y creaban consents duplicados.
  //    Solo el que gana la fila continúa.
  const { data: claimed, error: uErr } = await admin
    .from('consent_links')
    .update({
      status: 'signed',
      form_data: form,
      signature_data,
      signer_ip,
      signer_user_agent,
      signed_at: now,
      has_medical_alert: medicalAlert,
    })
    .eq('id', link.id)
    .eq('status', 'pending')
    .select('id')
  if (uErr) return dbError(uErr)
  if (!claimed || claimed.length === 0)
    return err('VALIDATION_ERROR', 'Este enlace ya no está disponible')

  // Persistir en el cliente lo que ya nos dio, para que el PRÓXIMO
  // consentimiento (u otra pantalla) ya no tenga que volver a pedirlo.
  await admin
    .from('clients')
    .update({
      birthdate: form.fecha_nacimiento || undefined,
      document_type: form.tipo_documento || undefined,
      document_number: form.numero_documento || undefined,
      address: form.direccion || undefined,
    })
    .eq('id', link.client_id)

  // 2) Crear el consentimiento firmado (lo ve el estudio) y enlazarlo.
  //    Esto va ANTES de las notificaciones/push a propósito: es lo único
  //    crítico de este flujo. Antes iba después, y un error sin capturar
  //    en el envío del push (llave VAPID mal formada) dejaba el link en
  //    'signed' con la firma guardada pero SIN crear nunca este registro
  //    — el cliente veía "firma guardada" pero el estudio nunca tenía el
  //    consentimiento, y un reintento chocaba con "enlace no disponible".
  const { data: consent, error: cErr } = await admin
    .from('consents')
    .insert({
      studio_id: link.studio_id,
      project_id: link.project_id,
      client_id: link.client_id,
      template_id: link.template_id,
      signature_data,
      signed_at: now,
    })
    .select('id')
    .single()
  if (cErr) {
    // Compensación: liberar el link para que el cliente pueda reintentar.
    await admin
      .from('consent_links')
      .update({ status: 'pending', signed_at: null })
      .eq('id', link.id)
    return dbError(cErr)
  }

  await admin.from('consent_links').update({ consent_id: consent.id }).eq('id', link.id)

  // 3) Notificaciones + push: puro efecto secundario, nunca debe tumbar el
  //    flujo ni dejar el consentimiento a medias — ya está guardado arriba.
  //    Todo este bloque va en su propio try/catch como red de seguridad
  //    extra, además de que `sendPushToArtist/Studio` ya nunca lanzan.
  try {
    // Tatuador asignado al proyecto (si lo hay) — determina a quién avisar,
    // tanto la notificación general de firma como la alerta médica.
    let projectArtistId: string | null = null
    if (link.project_id) {
      const { data: project } = await admin
        .from('projects')
        .select('artist_id')
        .eq('id', link.project_id)
        .maybeSingle()
      projectArtistId = project?.artist_id ?? null
    }

    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', link.client_id)
      .maybeSingle()

    const consentLink = link.project_id ? `/dashboard/projects/${link.project_id}` : undefined
    const consentTitle = '✅ Consentimiento firmado'
    const consentBody = client?.name
      ? `${client.name} firmó el consentimiento informado.`
      : 'Un cliente firmó el consentimiento informado.'

    // Notificación de firma: in-app + push. Si el proyecto tiene tatuador
    // asignado va solo para él (y el dueño, vía RLS); si no, para todo el
    // estudio.
    await admin.from('notifications').insert({
      studio_id: link.studio_id,
      artist_id: projectArtistId,
      title: consentTitle,
      body: consentBody,
      link: consentLink,
    })
    if (projectArtistId) {
      await sendPushToArtist(projectArtistId, { title: consentTitle, body: consentBody, link: consentLink })
    } else {
      await sendPushToStudio(link.studio_id, { title: consentTitle, body: consentBody, link: consentLink })
    }

    // Alerta médica privada: solo para el tatuador asignado al proyecto (y
    // el dueño del estudio, vía RLS de `notifications`) -- nunca para el
    // resto del equipo. Nunca incluye el detalle médico en sí, solo avisa.
    if (medicalAlert && projectArtistId) {
      const alertTitle = '⚕️ Alerta médica'
      const alertBody = 'Este cliente reportó una condición médica. Revísala antes de iniciar la sesión.'
      await admin.from('notifications').insert({
        studio_id: link.studio_id,
        artist_id: projectArtistId,
        title: alertTitle,
        body: alertBody,
        link: consentLink,
      })
      await sendPushToArtist(projectArtistId, { title: alertTitle, body: alertBody, link: consentLink })
    }
  } catch (notifyErr) {
    console.error('[consent-links] notificación de firma falló (no crítico)', notifyErr)
  }

  // El link se firma desde el navegador del CLIENTE (página pública), no
  // desde una sesión del estudio — revalidamos explícitamente para que la
  // próxima vez que el tatuador abra Inicio/el proyecto ya vea el check de
  // "firmado" sin depender de que esas rutas se hubieran marcado dynamic.
  revalidatePath('/dashboard')
  if (link.project_id) revalidatePath(`/dashboard/projects/${link.project_id}`)
  revalidatePath('/dashboard/consents')

  return ok(undefined)
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
