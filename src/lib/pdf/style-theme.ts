/**
 * Un único componente (`quote-og-image.tsx`) genera la imagen para todas las
 * cotizaciones; lo que cambia según el estilo del tatuaje son solo estos
 * pequeños parámetros visuales (opacidad del watermark, fuerza del overlay
 * sobre la foto, tracking del nombre) — NO hay cinco plantillas distintas,
 * hay una plantilla que lee `getStyleTheme(d.style)` y ajusta esos números.
 *
 * Reglas por estilo (según el brief del cliente):
 * - Realismo: hero muy fotográfico, alto contraste.
 * - Blackwork: mucho negro, contraste extremo, look agresivo.
 * - Línea fina: mucho más aire, más minimalista, watermark casi invisible.
 * - Japonés: tratamiento editorial, un poco más de aire que el default.
 * - Microrrealismo: la imagen protagonista, tipografía limpia (watermark bajo).
 * - Lettering: comportamiento estándar (el nombre del cliente ya es tipografía).
 * - Cualquier otro estilo (o sin estilo): valores por defecto.
 */

export type StyleTheme = {
  /** Opacidad del texto gigante del estilo detrás del nombre, en el hero. */
  watermarkOpacity: number
  /** Qué tan oscuro llega el degradado sobre la foto del hero (0-1). */
  heroOverlayStrength: number
  /** Tracking (letterSpacing, px) del nombre del cliente — más negativo = más condensado. */
  nameLetterSpacing: number
  /** Separación vertical entre tarjetas — más aire para estilos minimalistas. */
  sectionGap: number
}

const DEFAULT_THEME: StyleTheme = {
  watermarkOpacity: 0.1,
  heroOverlayStrength: 0.55,
  nameLetterSpacing: -3,
  sectionGap: 20,
}

const THEMES: Record<string, Partial<StyleTheme>> = {
  realismo: { watermarkOpacity: 0.12, heroOverlayStrength: 0.5, nameLetterSpacing: -3 },
  blackwork: { watermarkOpacity: 0.2, heroOverlayStrength: 0.75, nameLetterSpacing: -2 },
  'linea fina': { watermarkOpacity: 0.05, heroOverlayStrength: 0.4, nameLetterSpacing: -1, sectionGap: 28 },
  'fine line': { watermarkOpacity: 0.05, heroOverlayStrength: 0.4, nameLetterSpacing: -1, sectionGap: 28 },
  japones: { watermarkOpacity: 0.1, heroOverlayStrength: 0.5, nameLetterSpacing: -2, sectionGap: 24 },
  irezumi: { watermarkOpacity: 0.1, heroOverlayStrength: 0.5, nameLetterSpacing: -2, sectionGap: 24 },
  oriental: { watermarkOpacity: 0.1, heroOverlayStrength: 0.5, nameLetterSpacing: -2, sectionGap: 24 },
  microrrealismo: { watermarkOpacity: 0.07, heroOverlayStrength: 0.45, nameLetterSpacing: -2 },
  microrealismo: { watermarkOpacity: 0.07, heroOverlayStrength: 0.45, nameLetterSpacing: -2 },
  lettering: {},
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function getStyleTheme(style: string | null): StyleTheme {
  if (!style) return DEFAULT_THEME
  const s = normalize(style)
  const match = Object.keys(THEMES).find((key) => s.includes(normalize(key)))
  return match ? { ...DEFAULT_THEME, ...THEMES[match] } : DEFAULT_THEME
}
