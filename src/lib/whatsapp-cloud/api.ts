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
  templateStatusCache.delete(`${wabaId}:${t.name}`)
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
/** Estado de plantillas recién consultado: las páginas de campañas lo piden en
 * cada render y Meta corta la cuenta por exceso de llamadas (#80008). */
const templateStatusCache = new Map<string, { at: number; value: { status: string; reason: string | null } }>()

/** Aprobada casi nunca cambia; en revisión sí, así que se consulta más seguido. */
const ttl = (status: string) => (status === 'APPROVED' ? 10 * 60 * 1000 : 60 * 1000)

export async function fetchTemplateStatus(wabaId: string, token: string, name: string, opts?: { fresh?: boolean }) {
  const key = `${wabaId}:${name}`
  const hit = templateStatusCache.get(key)
  if (!opts?.fresh && hit && Date.now() - hit.at < ttl(hit.value.status)) {
    if (hit.value.status === MISSING) throw new Error(MISSING_MESSAGE)
    return hit.value
  }
  try {
    const value = await fetchTemplateStatusUncached(wabaId, token, name)
    templateStatusCache.set(key, { at: Date.now(), value })
    return value
  } catch (e) {
    if ((e as Error).message === MISSING_MESSAGE) {
      templateStatusCache.set(key, { at: Date.now(), value: { status: MISSING, reason: null } })
    }
    throw e
  }
}

const MISSING = '__MISSING__'
const MISSING_MESSAGE = 'La plantilla ya no existe en Meta'

async function fetchTemplateStatusUncached(wabaId: string, token: string, name: string) {
  const json = await graph<{ data?: { name: string; status: string; rejected_reason?: string }[] }>(
    `/${encodeURIComponent(wabaId)}/message_templates?name=${encodeURIComponent(name)}&fields=name,status,rejected_reason`,
    token
  )
  const t = json.data?.find((d) => d.name === name)
  if (!t) throw new Error(MISSING_MESSAGE)
  return { status: t.status, reason: t.rejected_reason && t.rejected_reason !== 'NONE' ? t.rejected_reason : null }
}

/** Envía la plantilla del formulario. `flowToken` vuelve en la respuesta. */
export async function sendFlowTemplate(
  account: WaAccountCredentials,
  to: string,
  t: { name: string; language: string; flowToken: string; flowData?: Record<string, unknown> }
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
              parameters: [
                {
                  type: 'action',
                  action: { flow_token: t.flowToken, ...(t.flowData ? { flow_action_data: t.flowData } : {}) },
                },
              ],
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

/* ───────────── Campañas (plantillas de Marketing con imagen) ───────────── */

/** App de Meta dueña del token (para subir la imagen de ejemplo). */
async function fetchAppId(token: string) {
  if (process.env.WHATSAPP_APP_ID) return process.env.WHATSAPP_APP_ID
  const json = await graph<{ id?: string }>('/app?fields=id', token)
  if (!json.id) throw new Error('No se pudo identificar la app de Meta')
  return json.id
}

/** Sube la imagen con la API de carga reanudable y devuelve el "handle" que
 * Meta pide como ejemplo del encabezado al crear la plantilla. */
export async function uploadTemplateMedia(token: string, file: { bytes: ArrayBuffer; mime: string }) {
  const appId = await fetchAppId(token)
  const session = await graph<{ id?: string }>(
    `/${encodeURIComponent(appId)}/uploads?file_length=${file.bytes.byteLength}&file_type=${encodeURIComponent(file.mime)}`,
    token,
    { method: 'POST' }
  )
  if (!session.id) throw new Error('Meta no abrió la carga de la imagen')
  const res = await fetch(`${GRAPH}/${session.id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, file_offset: '0' },
    body: file.bytes,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { h?: string } & GraphError
  if (!res.ok || !json.h) throw new Error(json.error?.message || `Meta no recibió la imagen (${res.status})`)
  return json.h
}

/** Envía a revisión una plantilla de Marketing: imagen, texto con variables,
 * pie en letra pequeña y botones de respuesta rápida. */
export async function createMarketingTemplate(
  wabaId: string,
  token: string,
  t: {
    name: string
    language: string
    /** Sin imagen: plantilla de solo texto. */
    headerHandle: string | null
    body: string
    example: string[]
    footer: string | null
    buttons: string[]
  }
) {
  templateStatusCache.delete(`${wabaId}:${t.name}`)
  return graph<{ id: string; status?: string; category?: string }>(
    `/${encodeURIComponent(wabaId)}/message_templates`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        name: t.name,
        language: t.language,
        category: 'MARKETING',
        components: [
          ...(t.headerHandle ? [{ type: 'HEADER', format: 'IMAGE', example: { header_handle: [t.headerHandle] } }] : []),
          { type: 'BODY', text: t.body, example: { body_text: [t.example] } },
          ...(t.footer ? [{ type: 'FOOTER', text: t.footer }] : []),
          ...(t.buttons.length
            ? [{ type: 'BUTTONS', buttons: t.buttons.map((text) => ({ type: 'QUICK_REPLY', text })) }]
            : []),
        ],
      }),
    }
  )
}

/** Envía una plantilla con imagen en el encabezado y variables en el texto. */
export async function sendImageTemplate(
  account: WaAccountCredentials,
  to: string,
  t: { name: string; language: string; imageLink: string; params: string[] }
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
            { type: 'header', parameters: [{ type: 'image', image: { link: t.imageLink } }] },
            ...(t.params.length ? [{ type: 'body', parameters: t.params.map((text) => ({ type: 'text', text })) }] : []),
          ],
        },
      }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}

/** Plantilla de Utilidad: texto con variables + botones de respuesta rápida. */
export async function createUtilityTemplate(
  wabaId: string,
  token: string,
  t: { name: string; language: string; body: string; example: string[]; buttons: string[] }
) {
  templateStatusCache.delete(`${wabaId}:${t.name}`)
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
          { type: 'BODY', text: t.body, example: { body_text: [t.example] } },
          { type: 'BUTTONS', buttons: t.buttons.map((text) => ({ type: 'QUICK_REPLY', text })) },
        ],
      }),
    }
  )
}

/** Todas las plantillas de la cuenta (con su contenido). */
export async function listTemplates(wabaId: string, token: string) {
  type Row = {
    name: string
    language: string
    status: string
    category: string
    rejected_reason?: string
    components?: { type: string; format?: string; text?: string; buttons?: { type: string; text: string; url?: string }[] }[]
  }
  const out: Row[] = []
  let path: string | null =
    `/${encodeURIComponent(wabaId)}/message_templates?fields=name,language,status,category,rejected_reason,components&limit=100`
  for (let i = 0; path && i < 10; i++) {
    const json: { data?: Row[]; paging?: { next?: string } } = await graph(path, token)
    out.push(...(json.data ?? []))
    const next = json.paging?.next
    path = next ? next.replace(/^https:\/\/graph\.facebook\.com\/v[\d.]+/, '') : null
  }
  return out
}

/** Plantilla de texto con variables y UN botón que abre una URL fija. */
export async function createUrlButtonTemplate(
  wabaId: string,
  token: string,
  t: { name: string; language: string; category: 'UTILITY' | 'MARKETING'; body: string; example: string[]; button: { text: string; url: string } }
) {
  templateStatusCache.delete(`${wabaId}:${t.name}`)
  return graph<{ id: string; status?: string; category?: string }>(
    `/${encodeURIComponent(wabaId)}/message_templates`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        name: t.name,
        language: t.language,
        category: t.category,
        components: [
          { type: 'BODY', text: t.body, example: { body_text: [t.example] } },
          { type: 'BUTTONS', buttons: [{ type: 'URL', text: t.button.text, url: t.button.url }] },
        ],
      }),
    }
  )
}

/** Envía una plantilla de solo texto con variables en el cuerpo. */
export async function sendBodyTemplate(
  account: WaAccountCredentials,
  to: string,
  t: { name: string; language: string; params: string[] }
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
          components: t.params.length
            ? [{ type: 'body', parameters: t.params.map((text) => ({ type: 'text', text })) }]
            : [],
        },
      }),
    }
  )
  const id = json.messages?.[0]?.id
  if (!id) throw new Error('Meta no devolvió el id del mensaje')
  return id
}
