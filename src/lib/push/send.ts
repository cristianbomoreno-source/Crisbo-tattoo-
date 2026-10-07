import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

/** `web-push` exige que la llave pública venga en Base64 URL-safe SIN "="
 * de relleno ("Vapid public key must be a URL safe Base 64 (without \"=\")")
 * — pero es facilísimo terminar con la llave en Base64 estándar (con `+`,
 * `/`, `=`) al generarla o copiarla a Vercel. Esto la normaliza sola, igual
 * que ya se hacía del lado del navegador en `lib/push/client.ts`. */
function sanitizeVapidKey(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** `VAPID_SUBJECT` no es Base64 (es un "mailto:" o "https://"), así que solo
 * le quitamos espacios/saltos de línea sobrantes — la misma clase de typo
 * de copiar/pegar que ya rompía las llaves. Un `sub` con basura alrededor
 * también hace que Apple rechace el JWT como "BadJwtToken". */
function sanitizeVapidSubject(raw: string | undefined): string | undefined {
  return raw?.trim().replace(/[\r\n]/g, '') || undefined
}

let configured = false
let configFailed = false
function ensureConfigured(): boolean {
  if (configured) return true
  if (configFailed) return false
  const rawPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const rawPrivateKey = process.env.VAPID_PRIVATE_KEY
  if (!rawPublicKey || !rawPrivateKey) return false
  try {
    const publicKey = sanitizeVapidKey(rawPublicKey)
    const privateKey = sanitizeVapidKey(rawPrivateKey)
    // Diagnóstico de "BadJwtToken" de Apple: NUNCA logueamos la llave en sí,
    // solo su largo en caracteres. Una pública válida (65 bytes crudos)
    // queda en 87 caracteres Base64url sin padding; una privada válida (32
    // bytes) queda en 43. Si estos números no cuadran, la llave llegó
    // truncada o incompleta a Vercel — causa típica de "BadJwtToken".
    console.log('[push] largo de llaves VAPID (esperado: pública=87, privada=43)', {
      publicKeyLength: publicKey.length,
      privateKeyLength: privateKey.length,
    })
    webpush.setVapidDetails(
      sanitizeVapidSubject(process.env.VAPID_SUBJECT) ?? 'mailto:soporte@ofink.app',
      publicKey,
      privateKey
    )
    configured = true
    return true
  } catch (e) {
    // Llave VAPID mal formada (espacios/saltos de línea pegados, etc.):
    // `setVapidDetails` lanza SÍNCRONO. Antes esto pasaba sin capturar y
    // tumbaba TODO el flujo que llamó al push (p. ej. dejaba un
    // consentimiento "reclamado" pero sin guardar, porque el push se manda
    // antes de crear el registro final). Ahora se recuerda como fallido y
    // nunca se vuelve a intentar en esta instancia — el push simplemente
    // no se envía, en vez de romper quien lo dispara.
    configFailed = true
    console.error('[push] Llave VAPID inválida, push deshabilitado', e)
    return false
  }
}

/**
 * Envía una notificación push a todos los navegadores suscritos del
 * estudio (tabla `push_subscriptions`). Nunca lanza — un push es un
 * efecto secundario, no debe tumbar el flujo que lo dispara (p. ej. el
 * bot de cotizaciones, o la firma de un consentimiento). Si faltan las
 * llaves VAPID en el entorno, o están mal formadas, no hace nada.
 * Suscripciones caducadas (410/404) se borran de paso.
 */
export async function sendPushToStudio(
  studioId: string,
  payload: { title: string; body: string; link?: string }
): Promise<void> {
  await sendPushToSubscriptions({ studio_id: studioId }, payload)
}

/** Igual que `sendPushToStudio`, pero solo a los navegadores de UN
 * tatuador puntual (p. ej. el recordatorio de su propia cita, o la
 * alerta médica que ya se manda solo al asignado). */
export async function sendPushToArtist(
  artistId: string,
  payload: { title: string; body: string; link?: string }
): Promise<void> {
  await sendPushToSubscriptions({ artist_id: artistId }, payload)
}

async function sendPushToSubscriptions(
  filter: { studio_id: string } | { artist_id: string },
  payload: { title: string; body: string; link?: string }
): Promise<void> {
  // `ensureConfigured()` (y todo lo demás) va DENTRO del try: antes vivía
  // afuera, así que si `setVapidDetails` lanzaba por una llave mal
  // formada, la excepción se escapaba de esta función por completo.
  try {
    if (!ensureConfigured()) return

    const admin = createAdminClient()
    const base = admin.from('push_subscriptions').select('id, endpoint, p256dh, auth')
    const { data: subs } =
      'studio_id' in filter ? await base.eq('studio_id', filter.studio_id) : await base.eq('artist_id', filter.artist_id)
    if (!subs?.length) return

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload)
          )
        } catch (e) {
          const statusCode = (e as { statusCode?: number })?.statusCode
          const body = (e as { body?: string })?.body
          if (statusCode === 404 || statusCode === 410) {
            // Suscripción caducada/inválida — se borra, es esperado.
            await admin.from('push_subscriptions').delete().eq('id', s.id)
          } else {
            // Cualquier otro código (400/401/403/etc.) es una falla real que
            // antes se tragaba en silencio y hacía IMPOSIBLE saber por qué
            // "no llegaba" el push (el resto del flujo seguía normal, sin
            // ningún rastro en los logs). Ahora queda logueado.
            console.error('[push] sendNotification falló', { statusCode, body, endpoint: s.endpoint })
          }
        }
      })
    )
  } catch {
    // Best-effort: nunca romper el flujo que envía el push.
  }
}
