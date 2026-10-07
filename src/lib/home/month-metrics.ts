import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import { calculateBalance } from '@/lib/projects/metrics'
import { dayKey } from '@/lib/calendar/utils'

/** Jornada por defecto para el heatmap y la ocupación (fallback si no hay `schedule`). */
export const WORKDAY_MINUTES = 8 * 60

/** Orden de días LUN..DOM. Debe coincidir EXACTAMENTE con WEEK_DAY_VALUES (src/lib/validations/onboarding.ts). */
const WEEKDAY_KEYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

/** Horario/días reales del estudio, capturados en el onboarding. Siempre opcional en las puras de abajo. */
export type StudioSchedule = {
  openDays: string[] | null
  openTime: string | null
  closeTime: string | null
}

/** Clave de WEEK_DAYS ('LUN'…'DOM') para un `dateKey` 'YYYY-MM-DD'. Usa Date.UTC: el dateKey ya es día-local Bogotá, no se re-aplica TZ. */
export function weekdayKeyOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const jsDay = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay() // 0=Dom..6=Sab
  return WEEKDAY_KEYS[(jsDay + 6) % 7]!
}

/** Minutos de jornada a partir de `openTime`/`closeTime`. Fallback WORKDAY_MINUTES si falta algo, formato inválido o el diff no es positivo. */
export function scheduleWorkdayMinutes(schedule?: StudioSchedule): number {
  if (!schedule?.openTime || !schedule.closeTime) return WORKDAY_MINUTES
  if (!HH_MM_REGEX.test(schedule.openTime) || !HH_MM_REGEX.test(schedule.closeTime)) return WORKDAY_MINUTES
  const [oh, om] = schedule.openTime.split(':').map(Number)
  const [ch, cm] = schedule.closeTime.split(':').map(Number)
  const diff = (Number(ch) * 60 + Number(cm)) - (Number(oh) * 60 + Number(om))
  return diff > 0 ? diff : WORKDAY_MINUTES
}

/** true si el día (dateKey) está abierto según `schedule`. Sin schedule, u openDays null/vacío = todo abierto. */
export function isOpenDay(dateKey: string, schedule?: StudioSchedule): boolean {
  if (!schedule?.openDays || schedule.openDays.length === 0) return true
  return schedule.openDays.includes(weekdayKeyOf(dateKey))
}

/** Nombre de pila a partir del nombre completo del artista. */
export function firstName(fullName: string): string {
  const t = fullName.trim().split(/\s+/)[0]
  return t || fullName
}

/** Saludo por hora local (0–11 días, 12–18 tardes, 19–23 noches). */
export function greetingWord(hour: number): 'Buenos días' | 'Buenas tardes' | 'Buenas noches' {
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Días del mes. `monthKey` = 'YYYY-MM'. */
export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-')
  return new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate()
}

/** Sesiones no canceladas cuyo día (TZ) cae en el mes. */
export function sessionsInMonth(sessions: SessionWithProject[], monthKey: string): SessionWithProject[] {
  return sessions.filter((s) => s.status !== 'cancelled' && dayKey(s.scheduled_at).startsWith(monthKey))
}

export type MonthMetrics = {
  scheduledSessions: number
  projectedIncome: number
  occupancyPct: number
  pendingToCollect: number
  freeDays: number
  /** Días del mes con ≥1 sesión (total informativo). Cuenta también sesiones en días cerrados o bloqueados. */
  daysWithSession: number
  /** Días ABIERTOS y no bloqueados con ≥1 sesión — el numerador del anillo de ocupación (siempre ≤ workableDays). */
  daysWithSessionOpen: number
  /** Total de días del mes. */
  daysInMonth: number
  /** Días abiertos del mes (según `schedule`) menos los bloqueados que caen en día abierto. Sin `schedule`, = daysInMonth - bloqueados. */
  workableDays: number
}

/**
 * Métricas del mes a partir de datos ya cargados. `today` = 'YYYY-MM-DD'.
 * `schedule` es opcional: sin él (o con openDays null/vacío) todos los días se tratan como abiertos (fallback = comportamiento previo).
 * Una sesión en día cerrado sigue contando para `scheduledSessions`/`daysWithSession`, pero NO para el numerador de `occupancyPct`
 * (la ocupación solo mira días abiertos) ni puede volver "libre" un día cerrado (`freeDays` solo cuenta días abiertos).
 */
export function monthMetrics(
  monthKey: string,
  sessions: SessionWithProject[],
  projects: ProjectSummary[],
  blockedDayKeys: string[],
  today: string,
  schedule?: StudioSchedule,
): MonthMetrics {
  const monthSessions = sessionsInMonth(sessions, monthKey)
  const daysWithSession = new Set(monthSessions.map((s) => dayKey(s.scheduled_at)))
  const blockedSet = new Set(blockedDayKeys.filter((d) => d.startsWith(monthKey)))
  const total = daysInMonth(monthKey)

  const scheduledSessions = monthSessions.length

  const projectIdsWithSession = new Set(monthSessions.map((s) => s.project_id))
  const projectedIncome = projects
    .filter((p) => projectIdsWithSession.has(p.id))
    .reduce((sum, p) => sum + (p.total_value ?? 0), 0)

  let workableDays = 0
  let daysWithSessionOpen = 0
  for (let day = 1; day <= total; day++) {
    const key = `${monthKey}-${String(day).padStart(2, '0')}`
    if (!isOpenDay(key, schedule)) continue
    if (blockedSet.has(key)) continue
    workableDays++
    if (daysWithSession.has(key)) daysWithSessionOpen++
  }
  const occupancyPct = workableDays > 0 ? Math.round((daysWithSessionOpen / workableDays) * 100) : 0

  const pendingToCollect = projects
    .filter((p) => p.status !== 'completed')
    .reduce((sum, p) => sum + Math.max(0, calculateBalance(p)), 0)

  let freeDays = 0
  for (let day = 1; day <= total; day++) {
    const key = `${monthKey}-${String(day).padStart(2, '0')}`
    if (key < today) continue
    if (!isOpenDay(key, schedule)) continue
    if (daysWithSession.has(key) || blockedSet.has(key)) continue
    freeDays++
  }

  return {
    scheduledSessions,
    projectedIncome,
    occupancyPct,
    pendingToCollect,
    freeDays,
    daysWithSession: daysWithSession.size,
    daysWithSessionOpen,
    daysInMonth: total,
    workableDays,
  }
}

/** Ingresos proyectados atribuibles a cada día del mes (valor de proyectos con sesión ese día). Serie real para el sparkline. */
export function dailyProjectedIncome(
  monthKey: string,
  sessions: SessionWithProject[],
  projects: ProjectSummary[],
): number[] {
  const total = daysInMonth(monthKey)
  const valueById = new Map(projects.map((p) => [p.id, p.total_value ?? 0]))
  const out = new Array<number>(total).fill(0)
  for (const s of sessionsInMonth(sessions, monthKey)) {
    const day = Number(dayKey(s.scheduled_at).slice(8, 10))
    if (day >= 1 && day <= total) out[day - 1] = (out[day - 1] ?? 0) + (valueById.get(s.project_id) ?? 0)
  }
  return out
}

/** Delta % (cur vs prev). null si prev es 0 — no computable, no inventar (DESIGN.md §7). */
export function deltaPct(cur: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}

export type DayCell = {
  dayKey: string
  day: number
  /** 'closed' = día no laborable según `schedule`. Prevalece sobre free/partial/full, pero 'blocked' (bloqueo explícito) prevalece sobre 'closed'. */
  state: 'free' | 'partial' | 'full' | 'blocked' | 'closed'
  remainingMinutes: number
}

/**
 * Estados por día del mes para el heatmap.
 * `schedule` es opcional (fallback: todos los días abiertos, jornada = `workdayMinutes`).
 * Si se pasa `schedule`, la jornada usada para full/partial es `scheduleWorkdayMinutes(schedule)` (ignora `workdayMinutes`).
 */
export function monthHeatmap(
  monthKey: string,
  sessions: SessionWithProject[],
  blockedDayKeys: string[],
  workdayMinutes: number = WORKDAY_MINUTES,
  schedule?: StudioSchedule,
): DayCell[] {
  const monthSessions = sessionsInMonth(sessions, monthKey)
  const blockedSet = new Set(blockedDayKeys.filter((d) => d.startsWith(monthKey)))
  const total = daysInMonth(monthKey)
  const minutesByDay = new Map<string, number>()
  for (const s of monthSessions) {
    const k = dayKey(s.scheduled_at)
    minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + s.duration_minutes)
  }
  const effectiveMinutes = schedule ? scheduleWorkdayMinutes(schedule) : workdayMinutes
  const cells: DayCell[] = []
  for (let day = 1; day <= total; day++) {
    const key = `${monthKey}-${String(day).padStart(2, '0')}`
    const mins = minutesByDay.get(key) ?? 0
    let state: DayCell['state']
    if (blockedSet.has(key)) state = 'blocked'
    else if (!isOpenDay(key, schedule)) state = 'closed'
    else if (mins === 0) state = 'free'
    else if (mins >= effectiveMinutes) state = 'full'
    else state = 'partial'
    cells.push({ dayKey: key, day, state, remainingMinutes: Math.max(0, effectiveMinutes - mins) })
  }
  return cells
}

/** Índice del primer día del mes con lunes=0 … domingo=6 (para alinear el grid). */
export function weekdayIndexMonday(monthKey: string): number {
  const [y, m] = monthKey.split('-')
  const jsDay = new Date(Date.UTC(Number(y), Number(m) - 1, 1)).getUTCDay() // 0=Dom..6=Sab
  return (jsDay + 6) % 7
}

/** Conteo de sesiones (no canceladas) por día del mes, para el sparkline. */
export function dailySessionCounts(monthKey: string, sessions: SessionWithProject[]): number[] {
  const total = daysInMonth(monthKey)
  const counts = new Array<number>(total).fill(0)
  for (const s of sessionsInMonth(sessions, monthKey)) {
    const day = Number(dayKey(s.scheduled_at).slice(8, 10))
    if (day >= 1 && day <= total) counts[day - 1] = (counts[day - 1] ?? 0) + 1
  }
  return counts
}
