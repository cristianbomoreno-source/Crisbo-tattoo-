/**
 * Plan de marketing de crisbotattoo.com/marketing: campañas y acciones
 * (reels, carruseles, historias, WhatsApp, anuncios) con su guion y, para
 * carruseles e historias, las láminas que se dibujan como imagen.
 */

export type ActionFormat = 'reel' | 'carrusel' | 'historias' | 'whatsapp' | 'ads'
export type ActionStatus = 'idea' | 'listo' | 'publicado'

/** Plantillas de lámina (estilo de los carruseles de @crisbotattoo). */
export type SlideTemplate =
  | 'cover' // portada: foto + título grande
  | 'point' // número dorado + título + texto + "LA VERDAD"
  | 'text' // fondo negro, título y lista
  | 'review' // reseña de Google con estrellas
  | 'cta' // cierre: palabra clave en píldora dorada
  | 'story' // historia 9:16 con título y texto
  | 'story-countdown' // historia con cuenta regresiva / cupos
  | 'story-poll' // historia con encuesta de dos opciones
  | 'story-cta' // historia con palabra clave

export type Slide = {
  id: string
  tpl: SlideTemplate
  /** Título. Lo que va entre *asteriscos* sale en dorado. Saltos de línea con \n. */
  title: string
  subtitle?: string
  body?: string
  /** Número grande dorado (plantilla point) o cifra (countdown). */
  number?: string
  /** Etiqueta corta ("LA VERDAD") + frase destacada. */
  label?: string
  highlight?: string
  /** Palabra clave en píldora (cta / story-cta). */
  kw?: string
  /** Opciones de encuesta (story-poll). */
  options?: [string, string]
  /** Autor de la reseña (review). */
  author?: string
  /** Foto de fondo: URL de la galería del estudio. Vacío = foto automática. */
  photo?: string
}

export type Campaign = {
  id: string
  name: string
  color: string
  dates: string
  kw: string
  promise: string
  price: string
  bonus: string
  guarantee: string
  scarcity: string
  ads: string
}

export type MarketingAction = {
  id: string
  /** YYYY-MM-DD */
  date: string
  time?: string
  fmt: ActionFormat
  camp: string
  title: string
  hook: string
  kw: string
  status: ActionStatus
  /** Guion: escenas del reel, mensaje de WhatsApp, texto del anuncio… */
  script: string
  /** Texto de la publicación (caption) cuando aplica. */
  caption?: string
  slides?: Slide[]
}

export type MarketingPlan = {
  version: number
  updatedAt: string
  campaigns: Campaign[]
  actions: MarketingAction[]
}

export const FORMAT_LABEL: Record<ActionFormat, string> = {
  reel: 'Reel',
  carrusel: 'Carrusel',
  historias: 'Historias',
  whatsapp: 'WhatsApp',
  ads: 'Anuncios',
}

export const STATUS_LABEL: Record<ActionStatus, string> = {
  idea: 'Idea',
  listo: 'Listo',
  publicado: 'Publicado',
}

export const isStorySlide = (s: Slide) => s.tpl.startsWith('story')
