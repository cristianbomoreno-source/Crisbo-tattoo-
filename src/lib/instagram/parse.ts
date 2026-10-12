/** Lectura pura del webhook de Instagram (API de Instagram con inicio de
 * sesión de Instagram). Sin I/O — testeable. */

export type IgEvent = {
  /** Cuenta profesional del estudio (entry.id). */
  igUserId: string
  /** IGSID del cliente: quien escribe, o a quien se le escribió en los ecos. */
  customerId: string
  /** `mid` de Meta, para deduplicar. */
  messageId: string
  timestamp: string
  /** true = lo envió el estudio (desde la app de Instagram o por la API). */
  echo: boolean
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'share' | 'unsupported'
  body: string | null
  mediaUrl: string | null
}

type IgAttachment = { type?: string; payload?: { url?: string; title?: string } }
type IgMessaging = {
  sender?: { id?: string }
  recipient?: { id?: string }
  timestamp?: number | string
  message?: {
    mid?: string
    text?: string
    is_echo?: boolean
    is_deleted?: boolean
    is_unsupported?: boolean
    attachments?: IgAttachment[]
    reply_to?: { story?: { url?: string; id?: string } }
  }
}
type IgWebhook = {
  object?: string
  entry?: {
    id?: string
    time?: number
    messaging?: IgMessaging[]
    /** Algunas versiones entregan los mensajes como `changes` (field "messages"). */
    changes?: { field?: string; value?: IgMessaging }[]
  }[]
}

const MEDIA: Record<string, IgEvent['type']> = {
  image: 'image',
  animated_image_share: 'image',
  video: 'video',
  audio: 'audio',
  file: 'document',
}

const SHARES: Record<string, string> = {
  share: '🔗 Compartió una publicación',
  ig_post: '🔗 Compartió una publicación',
  ig_reel: '🎬 Compartió un reel',
  reel: '🎬 Compartió un reel',
  story_mention: '📣 Te mencionó en su historia',
}

function toIso(ts: number | string | undefined) {
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString()
  // Instagram manda milisegundos; por si acaso, segundos también.
  return new Date(n < 1e12 ? n * 1000 : n).toISOString()
}

function join(...parts: (string | null | undefined)[]) {
  const text = parts.filter((p) => p && p.trim()).join('\n')
  return text || null
}

function parseMessaging(igUserId: string, m: IgMessaging): IgEvent | null {
  const msg = m.message
  if (!msg?.mid || msg.is_deleted) return null
  const echo = Boolean(msg.is_echo)
  const customerId = echo ? m.recipient?.id : m.sender?.id
  if (!customerId || customerId === igUserId) return null

  const base = { igUserId, customerId, messageId: msg.mid, timestamp: toIso(m.timestamp), echo }
  const story = msg.reply_to?.story
  const storyNote = story ? '↩️ Respondió a tu historia' : null

  const attachment = msg.attachments?.[0]
  if (attachment?.type) {
    const url = attachment.payload?.url ?? null
    const media = MEDIA[attachment.type]
    if (media) return { ...base, type: media, body: join(storyNote, msg.text), mediaUrl: url }
    const share = SHARES[attachment.type]
    if (share) {
      // La mención de historia trae la foto/video de la historia.
      if (attachment.type === 'story_mention') {
        return { ...base, type: 'image', body: share, mediaUrl: url }
      }
      return { ...base, type: 'share', body: join(share, attachment.payload?.title, url), mediaUrl: null }
    }
    return { ...base, type: 'unsupported', body: join(msg.text), mediaUrl: null }
  }

  if (msg.is_unsupported) return { ...base, type: 'unsupported', body: null, mediaUrl: null }
  if (!msg.text) return null
  return { ...base, type: 'text', body: join(storyNote, msg.text), mediaUrl: null }
}

export function parseInstagramWebhook(payload: unknown): IgEvent[] {
  const p = payload as IgWebhook
  if (p?.object !== 'instagram' || !Array.isArray(p.entry)) return []
  const events: IgEvent[] = []
  for (const entry of p.entry) {
    if (!entry?.id) continue
    const items = [
      ...(entry.messaging ?? []),
      ...(entry.changes ?? []).filter((c) => c.field === 'messages' && c.value).map((c) => c.value!),
    ]
    for (const m of items) {
      const e = parseMessaging(entry.id, m)
      if (e) events.push(e)
    }
  }
  return events
}

/** "@usuario" tal como se guarda en clients.instagram: sin @, en minúsculas. */
export function normalizeIgUsername(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
    .toLowerCase()
  return /^[a-z0-9._]{1,30}$/.test(v) ? v : null
}

/** Instagram limita cada mensaje de texto a 1000 caracteres: se parte en
 * trozos, cortando preferiblemente en un salto de línea o espacio. */
export function splitIgText(text: string, max = 1000): string[] {
  const chunks: string[] = []
  let rest = text.trim()
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max)
    if (cut < max / 2) cut = rest.lastIndexOf(' ', max)
    if (cut < max / 2) cut = max
    chunks.push(rest.slice(0, cut).trimEnd())
    rest = rest.slice(cut).trimStart()
  }
  if (rest) chunks.push(rest)
  return chunks
}
