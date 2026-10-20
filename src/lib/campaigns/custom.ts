/** Campañas creadas desde la app ("Crear campaña"). */

export const CUSTOM_LANGUAGE = 'es'
export const CUSTOM_FOOTER = 'Aplican términos y condiciones'
export const INTEREST_YES = 'Me interesa'
export const INTEREST_NO = 'No me interesa'
/** Lo que cuesta cada mensaje de Marketing en Colombia (aprox., COP). */
export const COST_PER_MESSAGE = 46

/** Plantillas "comodín": texto fijo + {{2}} = el mensaje de cada campaña.
 * Una con imagen (la imagen se elige al enviar) y otra solo texto. */
const COMODIN_BODY = [
  'Hola {{1}}, te habla Crisbo 👋',
  '',
  '{{2}}',
  '',
  'Si te interesa, respóndeme por aquí y lo hablamos 🖤',
].join('\n')
const COMODIN_EXAMPLE = [
  'Laura',
  'Este mes tengo una promoción especial en tatuajes pequeños de línea fina, desde $150.000 con el retoque incluido.',
]
export const COMODIN = {
  image: { name: 'campana_comodin_img_v1', body: COMODIN_BODY, example: COMODIN_EXAMPLE, image: true },
  text: { name: 'campana_comodin_v1', body: COMODIN_BODY, example: COMODIN_EXAMPLE, image: false },
} as const
export const COMODIN_BUTTONS = [INTEREST_YES, INTEREST_NO]

/** Encabezado de los mensajes de la campaña en el chat (y su marcador para estadísticas). */
export const customMarker = (name: string) => `📣 ${name}`

/** Plantilla de Meta, resumida para elegirla y enviarla. */
export type TemplateInfo = {
  name: string
  language: string
  status: string
  category: string
  rejectedReason: string | null
  header: 'IMAGE' | 'TEXT' | 'NONE' | 'OTHER'
  headerText: string | null
  body: string
  footer: string | null
  buttons: string[]
  /** Cuántas variables {{n}} tiene el texto. */
  paramCount: number
  /** Se puede usar desde la app (sin variables en encabezado ni botones especiales). */
  compatible: boolean
}

type MetaComponent = {
  type: string
  format?: string
  text?: string
  buttons?: { type: string; text: string; url?: string }[]
}

export function countParams(body: string) {
  const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))
  return nums.length ? Math.max(...nums) : 0
}

export function parseTemplate(t: {
  name: string
  language: string
  status: string
  category: string
  rejected_reason?: string
  components?: MetaComponent[]
}): TemplateInfo {
  const comps = t.components ?? []
  const header = comps.find((c) => c.type === 'HEADER')
  const body = comps.find((c) => c.type === 'BODY')?.text ?? ''
  const footer = comps.find((c) => c.type === 'FOOTER')?.text ?? null
  const buttons = comps.find((c) => c.type === 'BUTTONS')?.buttons ?? []
  const headerKind: TemplateInfo['header'] = !header
    ? 'NONE'
    : header.format === 'IMAGE'
      ? 'IMAGE'
      : header.format === 'TEXT'
        ? 'TEXT'
        : 'OTHER'
  const compatible =
    headerKind !== 'OTHER' &&
    !(headerKind === 'TEXT' && /\{\{\d+\}\}/.test(header?.text ?? '')) &&
    buttons.every((b) => b.type === 'QUICK_REPLY' || b.type === 'PHONE_NUMBER' || (b.type === 'URL' && !/\{\{\d+\}\}/.test(b.url ?? '')))
  return {
    name: t.name,
    language: t.language,
    status: t.status,
    category: t.category,
    rejectedReason: t.rejected_reason && t.rejected_reason !== 'NONE' ? t.rejected_reason : null,
    header: headerKind,
    headerText: headerKind === 'TEXT' ? (header?.text ?? null) : null,
    body,
    footer,
    buttons: buttons.map((b) => b.text),
    paramCount: countParams(body),
    compatible,
  }
}

/** Una variable de WhatsApp no admite saltos de línea, tabs ni más de 4
 * espacios seguidos. */
export function sanitizeParam(text: string) {
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, 900)
}

/** Reemplaza {{1}}, {{2}}… en el texto. */
export function renderBody(body: string, params: string[]) {
  return body.replace(/\{\{(\d+)\}\}/g, (m, n) => params[Number(n) - 1] ?? m)
}

/** Lo que queda guardado en el chat de cada cliente. */
export function customMessageText(c: { name: string; body: string; buttons: string[] }, params: string[]) {
  return [
    customMarker(c.name),
    '',
    renderBody(c.body, params),
    ...(c.buttons.length ? ['', c.buttons.map((b) => `[${b}]`).join(' ')] : []),
  ].join('\n')
}

/** Nombre válido para una plantilla nueva de Meta (minúsculas, números, _). */
export function templateNameFor(campaignName: string) {
  const slug = campaignName
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return `cmp_${slug || 'campana'}_${Date.now().toString(36)}`
}

/** Texto escrito con {nombre} → cuerpo de plantilla con {{1}}. */
export function bodyFromDraft(draft: string) {
  return draft.trim().replace(/\{nombre\}/gi, '{{1}}')
}

export type AudienceFilter = {
  segment: 'todos' | 'tatuados' | 'inactivos' | 'sin_visitas' | 'etapa'
  /** inactivos: sin venir hace al menos estos meses. */
  months?: number
  stage?: 'nuevo' | 'cotizando' | 'abono' | 'agendado' | 'perdido'
  /** Sacar a quien tiene cita próxima o se tatuó el último mes. */
  excludeBooked: boolean
  /** Sacar a quien recibió una campaña en los últimos 7 días. */
  excludeRecent: boolean
}

export type AudienceRow = {
  clientId: string
  name: string
  phone: string
  lastVisit: string | null
  stage: string | null
}

export type CampaignStatus = 'awaiting_template' | 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  awaiting_template: 'Esperando aprobación de Meta',
  draft: 'Borrador',
  scheduled: 'Programada',
  sending: 'Enviando',
  sent: 'Enviada',
  cancelled: 'Cancelada',
}
