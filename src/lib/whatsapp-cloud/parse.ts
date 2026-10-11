/** Lógica pura de la bandeja de WhatsApp: normalizar teléfonos, leer el
 * payload del webhook de Meta y la ventana de 24 h. Sin I/O — testeable. */

/** Solo dígitos con indicativo. Heurística Colombia (igual que `waLink`):
 * 10 dígitos → +57. Devuelve null si no queda nada usable. */
export function normalizeWaPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) digits = `57${digits}`
  return digits
}

/** Meta abre una ventana de 24 h para escribir texto libre desde el último
 * mensaje que mandó el cliente. Fuera de ella solo se aceptan plantillas. */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000

export function isServiceWindowOpen(lastInboundAt: string | null | undefined, now = Date.now()) {
  if (!lastInboundAt) return false
  return now - new Date(lastInboundAt).getTime() < SERVICE_WINDOW_MS
}

export type ParsedInbound = {
  phoneNumberId: string
  waId: string
  contactName: string | null
  waMessageId: string
  timestamp: string
  type: string
  body: string | null
  mediaId: string | null
  mediaMime: string | null
  mediaFilename: string | null
  /** `response_json` de un WhatsApp Flow completado (type 'form'). */
  flowResponse: string | null
}

export type ParsedStatus = {
  phoneNumberId: string
  waMessageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  error: string | null
}

const MEDIA_TYPES = ['image', 'audio', 'video', 'document', 'sticker'] as const

type WaMedia = { id?: string; mime_type?: string; caption?: string; filename?: string }
type WaMessage = {
  from?: string
  /** Solo en ecos (`smb_message_echoes`): número del cliente. */
  to?: string
  id?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string }
  interactive?: {
    type?: string
    button_reply?: { title?: string }
    list_reply?: { title?: string }
    nfm_reply?: { response_json?: string; body?: string }
  }
  location?: { latitude?: number; longitude?: number; name?: string; address?: string }
  reaction?: { emoji?: string }
} & Partial<Record<(typeof MEDIA_TYPES)[number], WaMedia>>

type WaValue = {
  metadata?: { phone_number_id?: string }
  contacts?: { wa_id?: string; profile?: { name?: string } }[]
  messages?: WaMessage[]
  /** Coexistencia: lo que el estudio envía desde la app WhatsApp Business del celular. */
  message_echoes?: WaMessage[]
  statuses?: { id?: string; status?: string; errors?: { title?: string; message?: string }[] }[]
}

type WaWebhook = { entry?: { changes?: { field?: string; value?: WaValue }[] }[] }

function messageText(m: WaMessage): string | null {
  switch (m.type) {
    case 'text':
      return m.text?.body ?? null
    case 'button':
      return m.button?.text ?? null
    case 'interactive':
      return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? null
    case 'location': {
      const l = m.location
      if (!l) return null
      const label = [l.name, l.address].filter(Boolean).join(' — ')
      return `${label ? `${label}\n` : ''}https://maps.google.com/?q=${l.latitude},${l.longitude}`
    }
    case 'reaction':
      return m.reaction?.emoji ?? null
    default: {
      const media = MEDIA_TYPES.includes(m.type as (typeof MEDIA_TYPES)[number])
        ? m[m.type as (typeof MEDIA_TYPES)[number]]
        : undefined
      return media?.caption ?? null
    }
  }
}

function toParsed(phoneNumberId: string, waId: string, contactName: string | null, m: WaMessage & { id: string }): ParsedInbound {
  const isMedia = MEDIA_TYPES.includes(m.type as (typeof MEDIA_TYPES)[number])
  const media = isMedia ? m[m.type as (typeof MEDIA_TYPES)[number]] : undefined
  const knownTypes = ['text', 'button', 'interactive', 'location', 'reaction', ...MEDIA_TYPES]
  const nfm = m.type === 'interactive' ? m.interactive?.nfm_reply : undefined
  return {
    phoneNumberId,
    waId,
    contactName,
    waMessageId: m.id,
    timestamp: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString(),
    type: nfm
      ? 'form'
      : m.type === 'button' || m.type === 'interactive'
        ? 'text'
        : knownTypes.includes(m.type ?? '') ? m.type! : 'unsupported',
    body: nfm ? null : messageText(m),
    mediaId: media?.id ?? null,
    mediaMime: media?.mime_type ?? null,
    mediaFilename: media?.filename ?? null,
    flowResponse: nfm?.response_json ?? null,
  }
}

/** Aplana el webhook de Meta en mensajes entrantes, cambios de estado y
 * ecos (respuestas que el estudio envió desde la app del celular, en modo
 * coexistencia: campo `smb_message_echoes`). */
export function parseWebhook(payload: unknown): {
  messages: ParsedInbound[]
  statuses: ParsedStatus[]
  echoes: ParsedInbound[]
} {
  const messages: ParsedInbound[] = []
  const statuses: ParsedStatus[] = []
  const echoes: ParsedInbound[] = []
  const body = payload as WaWebhook

  for (const entry of body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field && change.field !== 'messages' && change.field !== 'smb_message_echoes') continue
      const value = change.value
      const phoneNumberId = value?.metadata?.phone_number_id
      if (!value || !phoneNumberId) continue

      for (const m of value.messages ?? []) {
        if (!m.from || !m.id) continue
        const contact = value.contacts?.find((c) => c.wa_id === m.from) ?? value.contacts?.[0]
        messages.push(toParsed(phoneNumberId, m.from, contact?.profile?.name ?? null, { ...m, id: m.id }))
      }

      for (const m of value.message_echoes ?? []) {
        if (!m.to || !m.id) continue
        echoes.push(toParsed(phoneNumberId, m.to.replace(/\D/g, ''), null, { ...m, id: m.id }))
      }

      for (const s of value.statuses ?? []) {
        if (!s.id || !['sent', 'delivered', 'read', 'failed'].includes(s.status ?? '')) continue
        const e = s.errors?.[0]
        statuses.push({
          phoneNumberId,
          waMessageId: s.id,
          status: s.status as ParsedStatus['status'],
          error: e ? e.message || e.title || 'Error de envío' : null,
        })
      }
    }
  }
  return { messages, statuses, echoes }
}

/** Texto corto para la lista de chats. */
export function messagePreview(type: string, body: string | null): string {
  const labels: Record<string, string> = {
    image: '📷 Foto',
    audio: '🎤 Audio',
    video: '🎥 Video',
    document: '📄 Documento',
    sticker: 'Sticker',
    location: '📍 Ubicación',
    form: '📋 Formulario de datos',
    unsupported: 'Mensaje no soportado',
  }
  const text = body?.trim()
  if (type === 'text' || type === 'reaction' || type === 'template') return (text || '').slice(0, 120)
  const label = labels[type] ?? 'Mensaje'
  return text && type !== 'location' && type !== 'form' ? `${label}: ${text}`.slice(0, 120) : label
}

/** Orden de los estados: nunca bajar (Meta puede mandar "delivered" después de "read"). */
const STATUS_RANK: Record<string, number> = { sending: 0, sent: 1, delivered: 2, read: 3, failed: 4 }

export function shouldAdvanceStatus(current: string, next: string) {
  if (next === 'failed') return current !== 'read'
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[current] ?? 0) && current !== 'failed'
}
