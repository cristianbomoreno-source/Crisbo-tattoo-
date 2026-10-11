/** Cliente mínimo de la WhatsApp Cloud API (Graph API de Meta). Solo se usa
 * en el servidor: recibe el token del estudio (`whatsapp_accounts`), que
 * nunca llega al navegador. */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0'
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

export type WaAccountCredentials = {
  phone_number_id: string
  access_token: string
}

type GraphError = { error?: { message?: string; code?: number; error_data?: { details?: string } } }

async function graph<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as T & GraphError
  if (!res.ok) {
    const e = json.error
    throw new Error(e?.error_data?.details || e?.message || `Meta respondió ${res.status}`)
  }
  return json
}

/** Datos públicos del número — sirve para "Probar conexión" en Ajustes. */
export async function fetchPhoneNumberInfo(phoneNumberId: string, token: string) {
  return graph<{ display_phone_number?: string; verified_name?: string; id: string }>(
    `/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,
    token
  )
}

/** Envía un texto libre. Meta solo lo acepta dentro de la ventana de 24 h
 * desde el último mensaje del cliente (fuera de ella: plantillas). */
export async function sendTextMessage(account: WaAccountCredentials, to: string, body: string) {
  const json = await graph<{ messages?: { id: string }[] }>(
    `/${encodeURIComponent(account.phone_number_id)}/messages`,
    account.access_token,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body },
      }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}

/** Marca un mensaje entrante como leído (doble check azul para el cliente). */
export async function markMessageRead(account: WaAccountCredentials, waMessageId: string) {
  await graph(`/${encodeURIComponent(account.phone_number_id)}/messages`, account.access_token, {
    method: 'POST',
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: waMessageId }),
  })
}

/** Descarga un archivo multimedia (las URLs de Meta exigen el token y
 * caducan en minutos, por eso se sirven a través de nuestro proxy). */
export async function downloadMedia(mediaId: string, token: string) {
  const meta = await graph<{ url: string; mime_type?: string }>(`/${encodeURIComponent(mediaId)}`, token)
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el archivo (${res.status})`)
  return { body: res.body, mime: meta.mime_type || res.headers.get('content-type') || 'application/octet-stream' }
}
