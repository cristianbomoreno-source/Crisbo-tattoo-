import type { QuoteWithClient } from '@/queries/quotes'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'
import type { Client } from '@/queries/clients'
import { sessionsInMonth } from '@/lib/home/month-metrics'
import { dayKey } from '@/lib/calendar/utils'

/** Cotizaciones cuyo created_at cae en el mes (mismo criterio que la página ya usaba). */
export function quotesInMonth(quotes: QuoteWithClient[], monthKey: string): QuoteWithClient[] {
  return quotes.filter((q) => q.created_at.slice(0, 7) === monthKey)
}

/** Cotizaciones cuyo created_at cae en el rango de fechas. */
export function quotesInRange(quotes: QuoteWithClient[], from: string, to: string): QuoteWithClient[] {
  return quotes.filter((q) => {
    const date = q.created_at.slice(0, 10)
    return date >= from && date <= to
  })
}

/** Sesiones cuyo scheduled_at cae en el rango de fechas. */
export function sessionsInRange(sessions: SessionWithProject[], from: string, to: string): SessionWithProject[] {
  return sessions.filter((s) => {
    const date = dayKey(s.scheduled_at)
    return date >= from && date <= to
  })
}

/** Ingresos confirmados en un rango de fechas. */
export function confirmedIncomeInRange(projects: ProjectSummary[], from: string, to: string): number {
  let total = 0
  for (const p of projects) {
    for (const pay of p.payments) {
      const date = pay.paid_at?.slice(0, 10)
      if (date && date >= from && date <= to) total += pay.amount
    }
  }
  return total
}

/** Pagos en un rango de fechas con información del proyecto. */
export function paymentsInRange(projects: ProjectSummary[], from: string, to: string): MonthPayment[] {
  const payments: MonthPayment[] = []
  for (const p of projects) {
    for (const pay of p.payments) {
      const date = pay.paid_at?.slice(0, 10)
      if (date && date >= from && date <= to) {
        payments.push({
          id: pay.id,
          amount: pay.amount,
          paid_at: pay.paid_at,
          payment_method: pay.payment_method,
          project_id: p.id,
          project_name: p.name,
          client_name: p.clients?.name ?? 'Sin cliente',
        })
      }
    }
  }
  return payments.sort((a, b) => b.paid_at.localeCompare(a.paid_at))
}

/** Clientes activos en un rango (los que tienen cotizaciones en ese periodo). */
export function clientsInRange(
  clients: Client[],
  rangeQuotes: QuoteWithClient[],
  from: string,
  to: string
): { newClients: Client[]; recurringClients: Client[]; total: number } {
  const activeClientIds = new Set(rangeQuotes.map((q) => q.client_id))
  const active = clients.filter((c) => activeClientIds.has(c.id))
  const newClients = active.filter((c) => {
    const created = c.created_at.slice(0, 10)
    return created >= from && created <= to
  })
  const recurringClients = active.filter((c) => {
    const created = c.created_at.slice(0, 10)
    return created < from
  })
  return { newClients, recurringClients, total: active.length }
}

/** Horas trabajadas en sesiones de un rango de fechas. */
export function hoursInRange(
  sessions: SessionWithProject[],
  from: string,
  to: string
): { hours: number; sessionCount: number; completedCount: number } {
  const rangeSessions = sessionsInRange(sessions, from, to)
  const totalMinutes = rangeSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  return {
    hours: totalMinutes / 60,
    sessionCount: rangeSessions.length,
    completedCount: rangeSessions.filter((s) => s.status === 'completed').length,
  }
}

export type FunnelStage = { label: string; count: number }

/**
 * Embudo de ventas del mes. Cada etapa es un subconjunto real de `monthQuotes`
 * (o de `sessions`, para las dos últimas) — no hay cálculos inventados:
 * - Solicitudes: todas las cotizaciones creadas en el mes.
 * - Cotizaciones enviadas: las que ya tienen un precio asignado (`price` no nulo).
 * - Aprobadas: `status === 'approved'`.
 * - Sesiones agendadas: sesiones no canceladas cuyo día cae en el mes.
 * - Sesiones finalizadas: de esas, las que están en estado `completed`.
 */
export function salesFunnel(monthQuotes: QuoteWithClient[], monthSessions: SessionWithProject[]): FunnelStage[] {
  return [
    { label: 'Solicitudes', count: monthQuotes.length },
    { label: 'Cotizaciones enviadas', count: monthQuotes.filter((q) => q.price != null).length },
    { label: 'Aprobadas', count: monthQuotes.filter((q) => q.status === 'approved').length },
    { label: 'Sesiones agendadas', count: monthSessions.length },
    { label: 'Sesiones finalizadas', count: monthSessions.filter((s) => s.status === 'completed').length },
  ]
}

/** % de solicitudes del mes que terminaron aprobadas. null si no hubo solicitudes (no se dibuja el anillo). */
export function conversionPct(monthQuotes: QuoteWithClient[]): number | null {
  if (monthQuotes.length === 0) return null
  const approved = monthQuotes.filter((q) => q.status === 'approved').length
  return Math.round((approved / monthQuotes.length) * 100)
}

/** Ingresos esperados: suma de `price` de cotizaciones aprobadas o enviadas (esperando respuesta). */
export function expectedIncome(monthQuotes: QuoteWithClient[]): number {
  return monthQuotes
    .filter((q) => q.status === 'approved' || q.status === 'quoted')
    .reduce((sum, q) => sum + (q.price ?? 0), 0)
}

/** Valor pendiente por aprobar: cotizaciones ya enviadas (`quoted`) esperando decisión del cliente. */
export function pendingApprovalValue(monthQuotes: QuoteWithClient[]): number {
  return monthQuotes.filter((q) => q.status === 'quoted').reduce((sum, q) => sum + (q.price ?? 0), 0)
}

/** Ticket promedio: precio medio de las cotizaciones del mes que ya tienen precio. */
export function averageTicket(monthQuotes: QuoteWithClient[]): number {
  const priced = monthQuotes.filter((q) => q.price != null)
  if (priced.length === 0) return 0
  return Math.round(priced.reduce((sum, q) => sum + (q.price ?? 0), 0) / priced.length)
}

export type RankingRow = { label: string; count: number; pct: number }

/** Ranking de estilos más solicitados este mes (top N), a partir de `quotes.style`. */
export function stylesRanking(monthQuotes: QuoteWithClient[], top = 5): RankingRow[] {
  return countRanking(monthQuotes.map((q) => q.style).filter((v): v is string => !!v), top)
}

/** Ranking de zonas del cuerpo más elegidas (top N), a partir del primer segmento de `quotes.body_zone`
 * (p. ej. "Brazo — Antebrazo" cuenta como "Brazo"). */
export function zonesRanking(monthQuotes: QuoteWithClient[], top = 6): RankingRow[] {
  const zones = monthQuotes
    .map((q) => q.body_zone)
    .filter((v): v is string => !!v)
    .map((z) => z.split(' — ')[0]!.trim())
    .filter((z) => z !== 'No lo sé')
  return countRanking(zones, top)
}

function countRanking(values: string[], top: number): RankingRow[] {
  const total = values.length
  if (total === 0) return []
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
}

/** Horas tatuadas en el mes (sesiones no canceladas) y promedio por sesión. */
export function hoursTattooed(
  sessions: SessionWithProject[],
  monthKey: string
): { hours: number; avgPerSession: number; sessionCount: number } {
  const monthSessions = sessionsInMonth(sessions, monthKey)
  const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const hours = totalMinutes / 60
  const avgPerSession = monthSessions.length > 0 ? hours / monthSessions.length : 0
  return { hours, avgPerSession, sessionCount: monthSessions.length }
}

/** Ingresos confirmados: suma de `payments.paid_at` cuyo mes coincide con `monthKey`, entre todos los proyectos. */
export function confirmedIncome(projects: ProjectSummary[], monthKey: string): number {
  let total = 0
  for (const p of projects) {
    for (const pay of p.payments) {
      if (pay.paid_at?.slice(0, 7) === monthKey) total += pay.amount
    }
  }
  return total
}

export type MonthPayment = {
  id: string
  amount: number
  paid_at: string
  payment_method: string | null
  project_id: string
  project_name: string
  client_name: string
}

/** Todos los pagos del mes con información del proyecto y cliente. */
export function monthPayments(projects: ProjectSummary[], monthKey: string): MonthPayment[] {
  const payments: MonthPayment[] = []
  for (const p of projects) {
    for (const pay of p.payments) {
      if (pay.paid_at?.slice(0, 7) === monthKey) {
        payments.push({
          id: pay.id,
          amount: pay.amount,
          paid_at: pay.paid_at,
          payment_method: pay.payment_method,
          project_id: p.id,
          project_name: p.name,
          client_name: p.clients?.name ?? 'Sin cliente',
        })
      }
    }
  }
  // Ordenar por fecha descendente (más recientes primero)
  return payments.sort((a, b) => b.paid_at.localeCompare(a.paid_at))
}

/** Clientes nuevos (creados este mes) vs. recurrentes (ya existían y tuvieron actividad este mes). */
export function clientsBreakdown(
  clients: Client[],
  monthQuotes: QuoteWithClient[],
  monthKey: string
): { newClients: Client[]; recurringClients: Client[] } {
  const activeClientIds = new Set(monthQuotes.map((q) => q.client_id))
  const active = clients.filter((c) => activeClientIds.has(c.id))
  return {
    newClients: active.filter((c) => c.created_at.slice(0, 7) === monthKey),
    recurringClients: active.filter((c) => c.created_at.slice(0, 7) !== monthKey),
  }
}

/** Sesiones próximas: no canceladas, agendadas desde hoy en adelante. */
export function upcomingSessions(sessions: SessionWithProject[], today: string): SessionWithProject[] {
  return sessions.filter((s) => s.status !== 'cancelled' && dayKey(s.scheduled_at) >= today)
}

export type GenderBreakdown = { hombres: number; mujeres: number; total: number; pctHombres: number; pctMujeres: number }

/** Cuántas cotizaciones del mes son de hombres/mujeres — dato real de `quotes.gender`,
 * disponible desde v0.80.0 (antes de eso las cotizaciones no tienen este campo). */
export function genderBreakdown(monthQuotes: QuoteWithClient[]): GenderBreakdown {
  const withGender = monthQuotes.filter((q) => q.gender === 'Hombre' || q.gender === 'Mujer')
  const hombres = withGender.filter((q) => q.gender === 'Hombre').length
  const mujeres = withGender.filter((q) => q.gender === 'Mujer').length
  const total = withGender.length
  return {
    hombres,
    mujeres,
    total,
    pctHombres: total > 0 ? Math.round((hombres / total) * 100) : 0,
    pctMujeres: total > 0 ? Math.round((mujeres / total) * 100) : 0,
  }
}

export type AgeBracket = { label: string; count: number; pct: number }

const AGE_BRACKETS: Array<{ label: string; min: number; max: number }> = [
  { label: '10–17', min: 10, max: 17 },
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–45', min: 36, max: 45 },
  { label: '46+', min: 46, max: 200 },
]

/** Edad promedio + distribución por franjas — dato real de `quotes.age`. `average`
 * es `null` si ninguna cotización del mes tiene edad registrada (no se inventa un 0). */
export function ageStats(monthQuotes: QuoteWithClient[]): { average: number | null; brackets: AgeBracket[] } {
  const ages = monthQuotes.map((q) => q.age).filter((a): a is number => a != null)
  const average = ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null
  const brackets = AGE_BRACKETS.map(({ label, min, max }) => {
    const count = ages.filter((a) => a >= min && a <= max).length
    return { label, count, pct: ages.length > 0 ? Math.round((count / ages.length) * 100) : 0 }
  })
  return { average, brackets }
}
