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

/** La app de Meta es compartida con otros proyectos (Diego Neira, Keicy) y su
 * callback por defecto apunta a ellos. Para que los webhooks de ESTE número
 * lleguen a Crisbo Tattoo sin tocar a los demás, se fija un callback propio
 * en el número (Meta prioriza: número → WABA → app). Meta verifica la URL al
 * instante con un GET (hub.verify_token), así que el webhook debe estar
 * desplegado y con WHATSAPP_VERIFY_TOKEN configurado. */
export async function setPhoneWebhookOverride(
  account: WaAccountCredentials,
  callbackUrl: string,
  verifyToken: string
) {
  await graph(`/${encodeURIComponent(account.phone_number_id)}`, account.access_token, {
    method: 'POST',
    body: JSON.stringify({
      webhook_configuration: { override_callback_uri: callbackUrl, verify_token: verifyToken },
    }),
  })
}

/** Suscribe la app a la WABA (idempotente). Sin esto Meta no manda webhooks
 * de los números de esa cuenta, ni siquiera al callback del número. */
export async function subscribeAppToWaba(wabaId: string, token: string) {
  await graph(`/${encodeURIComponent(wabaId)}/subscribed_apps`, token, { method: 'POST' })
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

/* ───────────── Formulario de datos (WhatsApp Flow + plantilla) ───────────── */

type FlowValidationError = { error?: string; message?: string }

/** Crea el Flow y lo publica en un solo paso (Meta valida el JSON al crear). */
export async function createPublishedFlow(wabaId: string, token: string, name: string, flowJson: object) {
  const json = await graph<{ id?: string; validation_errors?: FlowValidationError[] }>(
    `/${encodeURIComponent(wabaId)}/flows`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ name, categories: ['SIGN_UP'], flow_json: JSON.stringify(flowJson), publish: true }),
    }
  )
  const problems = json.validation_errors ?? []
  if (!json.id || problems.length) {
    throw new Error(problems.map((p) => p.message || p.error).filter(Boolean).join(' · ') || 'Meta no creó el Flow')
  }
  return json.id
}

/** Envía la plantilla a revisión de Meta: texto + botón que abre el Flow. */
export async function createFlowTemplate(
  wabaId: string,
  token: string,
  t: { name: string; language: string; body: string; buttonText: string; flowId: string; firstScreen: string }
) {
  return graph<{ id: string; status?: string; category?: string }>(
    `/${encodeURIComponent(wabaId)}/message_templates`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        name: t.name,
        language: t.language,
        category: 'UTILITY',
        components: [
          { type: 'BODY', text: t.body },
          {
            type: 'BUTTONS',
            buttons: [
              { type: 'FLOW', text: t.buttonText, flow_id: t.flowId, flow_action: 'navigate', navigate_screen: t.firstScreen },
            ],
          },
        ],
      }),
    }
  )
}

/** Estado de revisión de una plantilla (PENDING, APPROVED, REJECTED…). */
export async function fetchTemplateStatus(wabaId: string, token: string, name: string) {
  const json = await graph<{ data?: { name: string; status: string; rejected_reason?: string }[] }>(
    `/${encodeURIComponent(wabaId)}/message_templates?name=${encodeURIComponent(name)}&fields=name,status,rejected_reason`,
    token
  )
  const t = json.data?.find((d) => d.name === name)
  if (!t) throw new Error('La plantilla ya no existe en Meta')
  return { status: t.status, reason: t.rejected_reason && t.rejected_reason !== 'NONE' ? t.rejected_reason : null }
}

/** Envía la plantilla del formulario. `flowToken` vuelve en la respuesta. */
export async function sendFlowTemplate(
  account: WaAccountCredentials,
  to: string,
  t: { name: string; language: string; flowToken: string }
) {
  const json = await graph<{ messages?: { id: string }[] }>(
    `/${encodeURIComponent(account.phone_number_id)}/messages`,
    account.access_token,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: t.name,
          language: { code: t.language },
          components: [
            {
              type: 'button',
              sub_type: 'flow',
              index: '0',
              parameters: [{ type: 'action', action: { flow_token: t.flowToken } }],
            },
          ],
        },
      }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}

/** Mensaje de ubicación nativo (mapa con pin + nombre y dirección). No es
 * plantilla: solo dentro de la ventana de 24 h, sin costo. */
export async function sendLocationMessage(
  account: WaAccountCredentials,
  to: string,
  loc: { latitude: number; longitude: number; name: string; address: string }
) {
  const json = await graph<{ messages?: { id: string }[] }>(
    `/${encodeURIComponent(account.phone_number_id)}/messages`,
    account.access_token,
    {
      method: 'POST',
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'location', location: loc }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}

/** Imagen por URL pública (Meta la descarga) con pie de foto opcional. */
export async function sendImageMessage(account: WaAccountCredentials, to: string, image: { link: string; caption?: string }) {
  const json = await graph<{ messages?: { id: string }[] }>(
    `/${encodeURIComponent(account.phone_number_id)}/messages`,
    account.access_token,
    {
      method: 'POST',
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'image', image }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}
