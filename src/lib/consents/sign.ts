import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { hasMedicalAlert } from '@/lib/consents/consent-fields'
import { sendPushToArtist, sendPushToStudio } from '@/lib/push/send'

export type PendingConsentLink = {
  id: string
  studio_id: string
  project_id: string | null
  client_id: string | null
  template_id: string | null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/** Guarda un consentimiento firmado: reclama el link, actualiza la ficha
 * del cliente, crea el registro en `consents` y avisa (push + alerta
 * médica). Lo usan la página pública (firma dibujada) y el webhook de
 * WhatsApp (firma electrónica desde el Flow). Corre con el cliente admin. */
export async function finalizeSignedConsent(
  admin: SupabaseClient,
  link: PendingConsentLink,
  input: {
    form: Record<string, unknown>
    signatureData: string | null
    signerIp: string | null
    signerUserAgent: string | null
  }
): Promise<Result<void>> {
  const { form, signatureData: signature_data, signerIp: signer_ip, signerUserAgent: signer_user_agent } = input
  const now = new Date().toISOString()
  const medicalAlert = hasMedicalAlert(form)

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
      birthdate: str(form.fecha_nacimiento) || undefined,
      document_type: str(form.tipo_documento) || undefined,
      document_number: str(form.numero_documento) || undefined,
      address: str(form.direccion) || undefined,
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
