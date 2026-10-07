import { subscribeToPushAction, unsubscribeFromPushAction } from '@/actions/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  // Defensa ante espacios/saltos de línea que a veces quedan pegados sin
  // querer al copiar la llave a Vercel (causa real: "The string contains
  // invalid characters" al llamar atob con basura alrededor).
  const clean = base64String.trim().replace(/[^A-Za-z0-9\-_]/g, '')
  const padding = '='.repeat((4 - (clean.length % 4)) % 4)
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/** Suscribe este navegador al Push (reutiliza la suscripción si ya existe
 * y coincide con la llave VAPID actual) y la guarda en el servidor.
 * Idempotente — se puede llamar en cada carga con permiso ya concedido sin
 * duplicar nada. Lanza (con mensaje claro) si algo falla, para que quien
 * llama pueda mostrarlo — antes fallaba en silencio y era imposible saber
 * por qué. */
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en el servidor')
  }
  const applicationServerKey = urlBase64ToUint8Array(publicKey)
  if (applicationServerKey.length !== 65) {
    throw new Error(
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY parece incompleta o mal copiada (${applicationServerKey.length} bytes, debería ser 65)`
    )
  }

  let sub = await registration.pushManager.getSubscription()
  // Si ya había una suscripción de un intento anterior con OTRA llave
  // (p. ej. de antes de configurar el push), Apple/el navegador la
  // rechaza en vez de reemplazarla sola — hay que darla de baja primero.
  if (sub) {
    const currentKey = sub.options?.applicationServerKey
    const matches =
      currentKey &&
      new Uint8Array(currentKey).length === applicationServerKey.length &&
      new Uint8Array(currentKey).every((b, i) => b === applicationServerKey[i])
    if (!matches) {
      await sub.unsubscribe().catch(() => {})
      sub = null
    }
  }

  if (!sub) {
    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e)
      throw new Error(`El navegador rechazó la suscripción push: ${reason}`)
    }
  }

  const json = sub.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('La suscripción del navegador no trajo las llaves esperadas')
  }

  const result = await subscribeToPushAction({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  })
  if (!result.success) {
    throw new Error(result.error.message)
  }
  return true
}

export async function unsubscribeFromPush(registration: ServiceWorkerRegistration): Promise<void> {
  const sub = await registration.pushManager.getSubscription()
  if (!sub) return
  await unsubscribeFromPushAction(sub.endpoint)
  await sub.unsubscribe()
}
