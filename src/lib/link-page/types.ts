import type { Icon3DName } from '@/components/ui/icon-3d'

/**
 * Tipos de botón de la página de links. Cada tipo define el ícono 3D y el
 * color de la tarjeta en la página pública (ya no se elige color a mano).
 * `field` cambia lo que se pide al crear el botón: un número de WhatsApp,
 * una dirección para el mapa o un enlace normal.
 */
export type LinkTypeKey =
  | 'whatsapp'
  | 'portfolio'
  | 'quote'
  | 'shop'
  | 'location'
  | 'website'
  | 'calendar'
  | 'phone'
  | 'star'
  | 'heart'
  | 'link'

export type LinkType = {
  key: LinkTypeKey
  label: string
  icon: Icon3DName
  tone: string
  field: 'whatsapp' | 'location' | 'phone' | 'url'
}

export const LINK_TYPES: LinkType[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'speech-balloon', tone: 'tile-green', field: 'whatsapp' },
  { key: 'portfolio', label: 'Portafolio', icon: 'framed-picture', tone: 'tile-purple', field: 'url' },
  { key: 'calendar', label: 'Agenda', icon: 'spiral-calendar', tone: 'tile-indigo', field: 'url' },
  { key: 'quote', label: 'Cotizar', icon: 'clipboard', tone: 'tile-sunset', field: 'url' },
  { key: 'location', label: 'Ubicación', icon: 'round-pushpin', tone: 'tile-blue', field: 'location' },
  { key: 'shop', label: 'Tienda', icon: 'shopping-bags', tone: 'tile-gold', field: 'url' },
  { key: 'website', label: 'Web', icon: 'globe', tone: 'tile-teal', field: 'url' },
  { key: 'phone', label: 'Llamar', icon: 'mobile-phone', tone: 'tile-slate', field: 'phone' },
  { key: 'star', label: 'Destacado', icon: 'star', tone: 'tile-gold', field: 'url' },
  { key: 'heart', label: 'Favorito', icon: 'red-heart', tone: 'tile-red', field: 'url' },
  { key: 'link', label: 'Enlace', icon: 'link', tone: 'tile-gray', field: 'url' },
]

export function linkType(key: string | null | undefined): LinkType {
  return LINK_TYPES.find((t) => t.key === key) ?? LINK_TYPES[LINK_TYPES.length - 1]!
}

/** Arma la URL según el tipo: número → wa.me / tel:, dirección → Google Maps. */
export function buildLinkUrl(field: LinkType['field'], value: string, message = ''): string {
  const v = value.trim()
  if (field === 'whatsapp') {
    const digits = v.replace(/\D/g, '')
    const phone = digits.length === 10 ? `57${digits}` : digits
    return `https://wa.me/${phone}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`
  }
  if (field === 'phone') return `tel:+${(v.replace(/\D/g, '').length === 10 ? '57' : '') + v.replace(/\D/g, '')}`
  if (field === 'location') return /^https?:\/\//i.test(v) ? v : `https://maps.google.com/?q=${encodeURIComponent(v)}`
  return /^(https?:|mailto:|tel:)/i.test(v) ? v : `https://${v}`
}

/** Lo que se muestra en el campo al editar un botón ya creado. */
export function linkFieldValue(field: LinkType['field'], url: string): { value: string; message: string } {
  if (field === 'whatsapp') {
    const m = url.match(/wa\.me\/(\d+)(?:\?text=(.*))?/)
    if (m) return { value: m[1]!.replace(/^57(?=\d{10}$)/, ''), message: m[2] ? decodeURIComponent(m[2]) : '' }
  }
  if (field === 'phone') {
    const m = url.match(/^tel:\+?(\d+)/)
    if (m) return { value: m[1]!.replace(/^57(?=\d{10}$)/, ''), message: '' }
  }
  if (field === 'location') {
    const m = url.match(/maps\.google\.com\/\?q=(.*)$/)
    if (m) return { value: decodeURIComponent(m[1]!), message: '' }
  }
  return { value: url, message: '' }
}
