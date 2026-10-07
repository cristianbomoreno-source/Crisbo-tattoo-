import { instagramHandle } from '@/lib/intake/instagram'
import { buildMessage } from '@/lib/quotes/message'
import { waLink } from '@/lib/whatsapp'
import type { QuoteWithClient } from '@/queries/quotes'
import type { CurrentStudio } from '@/queries/studio'

/** Subconjunto de `CurrentStudio` que necesita esta plantilla — permite
 * construirla también desde consultas públicas (service-role, sin sesión)
 * que no traen el estudio completo, como la landing de proyecto por token
 * (`queries/quote-links.ts`). Cualquier `CurrentStudio` ya cumple este tipo. */
export type QuoteTemplateStudio = Pick<
  CurrentStudio,
  | 'name'
  | 'logoUrl'
  | 'quoteTemplateColor'
  | 'whatsappPhone'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'website'
  | 'paymentPolicy'
  | 'cancellationPolicy'
  | 'studioRules'
  | 'paymentMethods'
  | 'quoteLetterMessage'
  | 'quotePriceNegotiable'
  | 'quoteConfirmTemplate'
>

/**
 * Toda la lógica de datos de la plantilla premium (PDF + imagen WhatsApp)
 * vive ACÁ, una sola vez — react-pdf y next/og son dos motores de render
 * distintos y no pueden compartir un mismo árbol JSX, pero sí pueden
 * consumir exactamente el mismo objeto ya derivado. No se vuelve a
 * consultar la base de datos: recibe el `Quote` + `studio` ya cargados.
 */

export const BRAND = {
  bg: '#090909',
  green: '#C8FF1A',
  greenPrint: '#8FB800', // el verde de marca puro pierde contraste como texto/borde sobre fondos claros — no aplica acá (todo es sobre negro), pero se usa igual en piezas impresas si hiciera falta.
  white: '#FFFFFF',
  grayLight: '#B8B8B8',
  gray: '#8A8A8A',
  grayDark: '#3A3A3A',
  card: '#141414',
  cardBorder: 'rgba(255,255,255,0.08)',
} as const

/** Paleta de acentos seleccionable en Ajustes → Personalización (ver
 * `template-color-picker.tsx`). El fondo negro nunca cambia — solo el color
 * de acento (título, línea del hero, badge de estado, íconos, QR). */
export const QUOTE_TEMPLATE_COLORS = {
  green: '#C8FF1A',
  white: '#FFFFFF',
  blue: '#3B82F6',
  red: '#EF4444',
} as const

export type QuoteTemplateColorId = keyof typeof QUOTE_TEMPLATE_COLORS

export function accentColorFor(id: string | null | undefined): string {
  return QUOTE_TEMPLATE_COLORS[(id ?? 'green') as QuoteTemplateColorId] ?? QUOTE_TEMPLATE_COLORS.green
}

/** "Tu experiencia incluye": copy fijo de marca — no depende de datos de la
 * cotización (no existe ese campo). Editar acá cambia todas las cotizaciones. */
export const EXPERIENCE_INCLUDES = [
  'Diseño exclusivo',
  'Planeación personalizada',
  'Ajustes antes de tatuar',
  'Seguimiento',
  'Recomendaciones de cuidado',
  'Prioridad para agendar',
] as const

/** Carta del tatuador en la landing del proyecto (`quote-message.tsx`) —
 * plantilla por defecto cuando el estudio no personalizó la suya (Ajustes →
 * Cotizaciones → Carta y negociación). Admite `{nombre_cliente}`, igual que
 * el mensaje de WhatsApp (`lib/quotes/message.ts`). */
export const DEFAULT_LETTER_MESSAGE =
  'Hola {nombre_cliente}.\n\nGracias por confiar en mi trabajo. Cada tatuaje que realizo tiene una historia detrás, y esta será la tuya.\n\nQuiero que esta experiencia sea tan buena como el resultado final. Aquí encontrarás todo sobre el proyecto que imaginamos juntos.\n\nNos vemos muy pronto.'

/** Mensaje de WhatsApp de "Reservar mi proyecto" / "¿Tienes dudas?" en la
 * landing pública de una cotización (Ajustes → Personalización → Plantillas
 * de WhatsApp, `quote_confirm_template`). */
export const DEFAULT_QUOTE_CONFIRM_TEMPLATE = 'Hola, quiero más información sobre mi cotización {id_cotizacion}.'

export type QuoteTemplateData = {
  code: string
  clientName: string
  projectLabel: string
  dateLabel: string
  statusLabel: string
  price: number
  isCourtesy: boolean
  depositPercentage: number
  depositAmount: number
  sessionCount: number
  avgSessionDuration: string | null
  description: string | null
  style: string | null
  bodyZone: string | null
  color: string | null
  size: string | null
  skinTone: string | null
  service: string | null
  availability: string | null
  photoUrl: string | null
  referencePhotos: string[]
  studioName: string
  studioLogoUrl: string | null
  /** Color de acento resuelto (hex) según la preferencia del estudio — ver `accentColorFor`. */
  templateColor: string
  whatsapp: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  waLink: string | null
  paymentPolicy: string | null
  cancellationPolicy: string | null
  rules: string[]
  paymentMethodsLine: string | null
  /** Carta del tatuador (ya con `{nombre_cliente}` resuelto). */
  letterMessage: string
  /** Si el estudio permite negociar el valor desde la landing del proyecto. */
  priceNegotiable: boolean
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nueva',
  reviewed: 'Revisada',
  quoted: 'Cotizada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

export function paymentMethodsLine(methods: string[] | null | undefined): string | null {
  const clean = (methods ?? []).map((m) => m.trim()).filter(Boolean)
  return clean.length > 0 ? clean.join(' · ') : null
}

export function buildQuoteTemplateData(
  q: QuoteWithClient,
  studio: QuoteTemplateStudio | null,
  photoUrl: string | null,
  referencePhotos: string[]
): QuoteTemplateData {
  const depositAmount = q.is_courtesy ? 0 : Math.round(((q.price ?? 0) * q.deposit_percentage) / 100)
  const igHandle = instagramHandle(studio?.instagram ?? null)

  return {
    code: `OFK-${q.id.slice(0, 8).toUpperCase()}`,
    clientName: q.clients?.name ?? 'Cliente',
    projectLabel: [q.style, q.body_zone].filter(Boolean).join(' — ') || 'Tatuaje',
    dateLabel: new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(q.created_at)
    ),
    statusLabel: STATUS_LABELS[q.status] ?? q.status,
    price: q.price ?? 0,
    isCourtesy: q.is_courtesy,
    depositPercentage: q.deposit_percentage,
    depositAmount,
    sessionCount: q.session_count ?? 1,
    avgSessionDuration: q.avg_session_duration,
    description: q.description,
    style: q.style,
    bodyZone: q.body_zone,
    color: q.color,
    size: q.size,
    skinTone: q.skin_tone,
    service: q.service,
    availability: q.availability,
    photoUrl,
    referencePhotos,
    studioName: studio?.name || 'OFINK',
    studioLogoUrl: studio?.logoUrl ?? null,
    templateColor: accentColorFor(studio?.quoteTemplateColor),
    whatsapp: studio?.whatsappPhone ?? null,
    instagram: igHandle,
    tiktok: studio?.tiktok ?? null,
    facebook: studio?.facebook ?? null,
    website: studio?.website ?? null,
    waLink: waLink(
      studio?.whatsappPhone ?? null,
      buildMessage(studio?.quoteConfirmTemplate || DEFAULT_QUOTE_CONFIRM_TEMPLATE, {
        id_cotizacion: q.id.slice(0, 8).toUpperCase(),
      })
    ),
    paymentPolicy: studio?.paymentPolicy ?? null,
    cancellationPolicy: studio?.cancellationPolicy ?? null,
    rules: studio?.studioRules ?? [],
    paymentMethodsLine: paymentMethodsLine(studio?.paymentMethods),
    letterMessage: buildMessage(studio?.quoteLetterMessage || DEFAULT_LETTER_MESSAGE, {
      nombre_cliente: q.clients?.name ?? 'Cliente',
    }),
    priceNegotiable: studio?.quotePriceNegotiable ?? false,
  }
}
