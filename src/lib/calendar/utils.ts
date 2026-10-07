import type { SessionWithProject } from '@/queries/sessions'

/** Zona horaria de referencia (Colombia, sin DST). */
export const TZ = 'America/Bogota'

/** Primera letra en mayúscula — usado para mostrar meses/etiquetas capitalizados. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Convención de tiempo de OFINK: la hora que el usuario escribe en
 * <input type="datetime-local"> se guarda como "hora de pared" (los componentes
 * UTC del timestamptz). Por eso, para MOSTRAR una sesión se leen de vuelta los
 * componentes UTC — NO se convierte a Bogotá, o la hora se correría 5h.
 * `todayKey` sí usa Bogotá porque representa el instante real "ahora".
 * Ver `toDatetimeLocal` (round-trip) más abajo.
 */

/** Clave de día (YYYY-MM-DD) de una sesión, en su hora-de-pared guardada. */
export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Clave de hoy (YYYY-MM-DD) en Bogotá (instante real). */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Minutos desde medianoche (hora-de-pared) de una sesión. */
export function minutesOfDay(iso: string): number {
  const d = new Date(iso)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

/** Hora legible: "2:00 p. m." (hora-de-pared guardada). */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** "HH:MM" para etiquetas de la columna de horas. */
export function labelHour(minutes: number): string {
  const h = Math.floor(minutes / 60)
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, h, 0)))
}

export function ymOfKey(key: string): { year: number; month: number; day: number } {
  const [y, m, d] = key.split('-')
  return { year: Number(y), month: Number(m) - 1, day: Number(d) }
}

/**
 * "Ahora mismo", pero expresado en la MISMA convención de hora-de-pared que
 * `scheduled_at` (componentes UTC = hora de Bogotá), para poder comparar
 * un timestamp guardado contra el instante actual.
 *
 * Bug real que esto corrige: en varios lugares del código se comparaba
 * `Date.now()` (instante UTC de verdad) directo contra `scheduled_at`
 * (hora de Bogotá disfrazada de UTC) — como Bogotá es UTC-5, esa
 * comparación traía un corrimiento constante de 5 horas, así que una sesión
 * de las 9:00a que en la vida real todavía no empezaba podía verse como "ya
 * pasada" apenas dieran las 9:00a **UTC** (4:00a en Bogotá). Efecto visible:
 * "Próxima sesión" en Inicio saltándose la primera cita del día y mostrando
 * la segunda, "en curso" marcado en la cita equivocada del calendario de
 * Estudio, sesiones futuras cayéndose de "próxima sesión" en Proyectos, etc.
 *
 * `nowAsWallClock().getTime()` sí se puede comparar 1:1 contra
 * `new Date(scheduled_at).getTime()`.
 */
export function nowAsWallClock(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  // Algunos motores devuelven "24" para medianoche con hour12:false — se
  // normaliza a 0 (mismo instante, siguiente día ya lo dan bien año/mes/día).
  const hour = get('hour') % 24
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second')))
}

/** 'YYYY-MM' → mes desplazado. */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-')
  const d = new Date(Date.UTC(Number(y), Number(m) - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

/** 'YYYY-MM-DD' → día desplazado. */
export function shiftDay(key: string, delta: number): string {
  const { year, month, day } = ymOfKey(key)
  const d = new Date(Date.UTC(year, month, day + delta))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Etiqueta de mes: "junio de 2026". */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  return new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(y), Number(m) - 1, 15)))
}

/** Etiqueta de día: "lunes, 12 de julio". */
export function dayLabel(key: string): string {
  const { year, month, day } = ymOfKey(key)
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, day)))
}

/** Matriz del mes (semanas Lun–Dom) como claves YYYY-MM-DD. monthKey = 'YYYY-MM'. */
export function getMonthMatrix(monthKey: string): string[][] {
  const [yy, mm] = monthKey.split('-')
  const year = Number(yy)
  const month = Number(mm) - 1
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (first.getUTCDay() + 6) % 7 // Lun=0 … Dom=6
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const numWeeks = Math.ceil((offset + daysInMonth) / 7)

  const cursor = new Date(Date.UTC(year, month, 1 - offset))
  const weeks: string[][] = []
  for (let w = 0; w < numWeeks; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      week.push(
        `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`
      )
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** ISO → valor para <input type="datetime-local"> ("YYYY-MM-DDTHH:MM"),
 * recuperando la hora-pared guardada (componentes UTC) para round-trip sin drift. */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** Agrupa sesiones por clave de día (Bogotá). */
export function groupByDay(
  sessions: SessionWithProject[]
): Map<string, SessionWithProject[]> {
  const map = new Map<string, SessionWithProject[]>()
  for (const s of sessions) {
    const k = dayKey(s.scheduled_at)
    const arr = map.get(k) ?? []
    arr.push(s)
    map.set(k, arr)
  }
  return map
}

/** Claves YYYY-MM-DD de la semana (Lun→Dom) que contiene `anchorKey`. */
export function getWeekKeys(anchorKey: string): string[] {
  const { year, month, day } = ymOfKey(anchorKey)
  const base = new Date(Date.UTC(year, month, day))
  const offset = (base.getUTCDay() + 6) % 7 // Lun=0 … Dom=6
  const monday = new Date(Date.UTC(year, month, day - offset))
  const keys: string[] = []
  for (let i = 0; i < 7; i++) {
    const c = new Date(monday)
    c.setUTCDate(monday.getUTCDate() + i)
    keys.push(`${c.getUTCFullYear()}-${pad(c.getUTCMonth() + 1)}-${pad(c.getUTCDate())}`)
  }
  return keys
}

/** Todas las claves de día (YYYY-MM-DD) del mes que contiene `anchorKey`,
 * para la tira del Inicio deslizable por el mes completo. */
export function getMonthKeys(anchorKey: string): string[] {
  const { year, month } = ymOfKey(anchorKey)
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const keys: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    keys.push(`${year}-${pad(month + 1)}-${pad(d)}`)
  }
  return keys
}

// getUTCDay(): 0=domingo, 1=lunes, ... 6=sábado — mismos códigos que
// `studios.open_days` (Ajustes → Horario, WEEK_DAYS en onboarding/constants).
const WEEKDAY_CODES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const

/** Claves de día (YYYY-MM-DD) dentro de [fromKey, toKey] cuyo día de la
 * semana NO está en `openDays` — para pintarlas como bloqueadas en el
 * calendario junto a las de `blocked_days`. Si `openDays` es null/vacío
 * (estudio sin horario configurado), no bloquea nada. */
export function expandClosedWeekdays(
  fromKey: string,
  toKey: string,
  openDays: string[] | null | undefined
): string[] {
  if (!openDays || openDays.length === 0) return []
  const keys: string[] = []
  const cursor = new Date(`${fromKey}T00:00:00Z`)
  const end = new Date(`${toKey}T00:00:00Z`)
  while (cursor.getTime() <= end.getTime()) {
    const code = WEEKDAY_CODES[cursor.getUTCDay()]!
    if (!openDays.includes(code)) {
      keys.push(
        `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`
      )
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}
