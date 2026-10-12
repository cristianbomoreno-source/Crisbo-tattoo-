/** Formatos de hora/fecha de la bandeja, SIEMPRE en hora de Colombia: el
 * servidor (UTC en Vercel) y el navegador deben producir el mismo texto, o
 * React lanza un error de hidratación (#418). */

const TIME_ZONE = 'America/Bogota'
/** Colombia no tiene horario de verano: UTC−5 todo el año. */
const BOGOTA_OFFSET_MS = -5 * 3_600_000

const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE })
const dayFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: TIME_ZONE })
const longDayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })

/** Número de día (en hora de Colombia), para comparar "hoy"/"ayer". */
function startOfDay(d: Date) {
  return Math.floor((d.getTime() + BOGOTA_OFFSET_MS) / 86_400_000)
}

/** Lista de chats: "3:45 p. m." hoy, "Ayer", o "12 oct". */
export function formatListTime(iso: string, now = new Date()) {
  const d = new Date(iso)
  const diffDays = startOfDay(now) - startOfDay(d)
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
  const diffDays = startOfDay(now) - startOfDay(d)
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

/** Recordatorio de seguimiento: "Hoy, 3:00 p. m.", "Mañana, 10:00 a. m." o "15 oct, 10:00 a. m.". */
export function formatFollowUp(iso: string, now = new Date()) {
  const d = new Date(iso)
  const diffDays = startOfDay(d) - startOfDay(now)
  const time = timeFmt.format(d)
  if (diffDays === 0) return `Hoy, ${time}`
  if (diffDays === 1) return `Mañana, ${time}`
  if (diffDays === -1) return `Ayer, ${time}`
  return `${dayFmt.format(d)}, ${time}`
}

/** Iniciales para el avatar del chat ("Ana Pérez" → "AP"). */
export function chatInitials(name: string) {
  const words = name.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean)
  if (words.length >= 2) return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
  return (words[0] ?? '').slice(0, 2).toUpperCase() || '#'
}
