/** Formatos de hora/fecha de la bandeja (zona horaria del navegador). */

const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const longDayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Lista de chats: "3:45 p. m." hoy, "Ayer", o "12 oct". */
export function formatListTime(iso: string, now = new Date()) {
  const d = new Date(iso)
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (diffDays === 0) return timeFmt.format(d)
  if (diffDays === 1) return 'Ayer'
  return dayFmt.format(d)
}

export function formatMessageTime(iso: string) {
  return timeFmt.format(new Date(iso))
}

/** Separador de día dentro del chat. */
export function formatDayLabel(iso: string, now = new Date()) {
  const d = new Date(iso)
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return longDayFmt.format(d)
}

export function sameDay(a: string, b: string) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b))
}

/** "+57 300 123 4567" a partir de "573001234567" (solo Colombia; resto tal cual). */
export function formatWaPhone(waId: string) {
  if (waId.length === 12 && waId.startsWith('57')) {
    return `+57 ${waId.slice(2, 5)} ${waId.slice(5, 8)} ${waId.slice(8)}`
  }
  return `+${waId}`
}

/** Tiempo restante de la ventana de 24 h, p. ej. "18 h" o "40 min". */
export function formatWindowRemaining(lastInboundAt: string, now = Date.now()) {
  const ms = new Date(lastInboundAt).getTime() + 24 * 3_600_000 - now
  if (ms <= 0) return null
  const hours = Math.floor(ms / 3_600_000)
  return hours >= 1 ? `${hours} h` : `${Math.max(1, Math.floor(ms / 60_000))} min`
}
