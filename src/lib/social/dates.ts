/** Fechas del análisis de redes en hora de Colombia (UTC−5 todo el año). */

const OFFSET_MS = 5 * 3_600_000

/** 'YYYY-MM-DD' en Colombia. */
export function bogotaDay(d: Date | number = Date.now()) {
  return new Date(new Date(d).getTime() - OFFSET_MS).toISOString().slice(0, 10)
}

export function bogotaMonth(d: Date | number = Date.now()) {
  return bogotaDay(d).slice(0, 7)
}

/** Instante UTC en que empieza ese día en Colombia. */
export function dayStart(day: string) {
  return new Date(`${day}T05:00:00Z`)
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function shiftMonthKey(month: string, n: number) {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

export function daysInMonthKey(month: string) {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
}

/** Últimos `n` meses terminando en `month` (incluido), del más viejo al más nuevo. */
export function lastMonths(month: string, n: number) {
  return Array.from({ length: n }, (_, i) => shiftMonthKey(month, i - n + 1))
}

/** "oct", "nov"… */
export function monthShort(month: string) {
  return new Date(`${month}-15T12:00:00Z`)
    .toLocaleDateString('es-CO', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')
}

export function monthLong(month: string) {
  return new Date(`${month}-15T12:00:00Z`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
