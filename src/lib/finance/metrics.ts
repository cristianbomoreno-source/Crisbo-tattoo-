import type { QuoteWithClient } from '@/queries/quotes'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'
import { calculateBalance, nextSession } from '@/lib/projects/metrics'
import { dayKey, nowAsWallClock } from '@/lib/calendar/utils'

export type FinanceTone = 'good' | 'warn' | 'bad'

export type FinanceHealth = {
  tone: FinanceTone
  emoji: string
  label: string
  message: string
}

/**
 * "Salud financiera": lectura automática de dos señales reales — % ya
 * cobrado de lo facturado este mes, y % de avance hacia la meta mensual
 * (si hay una configurada en Ajustes → Metas). Reglas simples, sin
 * inventar datos: solo interpreta números que ya existen en otras partes
 * de la app (`confirmedIncome`, `quotedValue`, `monthlyGoalQuotedValue`).
 */
export function financeHealth(
  collectedPct: number | null,
  goalProgressPct: number | null
): FinanceHealth {
  if (collectedPct === null) {
    return {
      tone: 'warn',
      emoji: '🟡',
      label: 'Arrancando el mes',
      message: 'Todavía no hay cotizaciones este mes — cuando lleguen, vas a ver el estado de tu facturación acá.',
    }
  }
  if (collectedPct >= 80 && (goalProgressPct === null || goalProgressPct >= 60)) {
    return {
      tone: 'good',
      emoji: '🟢',
      label: 'Excelente',
      message:
        goalProgressPct !== null
          ? `Has cobrado el ${collectedPct}% de lo facturado este mes y vas al ${goalProgressPct}% de tu meta.`
          : `Has cobrado el ${collectedPct}% de lo facturado este mes.`,
    }
  }
  if (collectedPct >= 45) {
    return {
      tone: 'warn',
      emoji: '🟡',
      label: 'En crecimiento',
      message: 'Tu agenda se está moviendo, pero todavía tienes varios pagos pendientes por cobrar.',
    }
  }
  return {
    tone: 'bad',
    emoji: '🔴',
    label: 'Atención',
    message: 'Lo cobrado este mes está muy por debajo de lo facturado — vale la pena hacer seguimiento a los pendientes.',
  }
}

export type PendingRow = {
  projectId: string
  clientName: string
  balance: number
  dueDate: Date | null
  status: 'al-dia' | 'proximo' | 'vencido'
  clientPhone: string | null
}

/** Proyectos con saldo pendiente (`calculateBalance` > 0), con un estado
 * aproximado a partir de su próxima sesión agendada (no hay un campo de
 * "fecha límite de pago" real en la BD, así que se usa la próxima sesión
 * como referencia — vencido si ya pasó y sigue debiendo, próximo si es en
 * ≤3 días, al día en cualquier otro caso). */
export function pendingPayments(
  projects: ProjectSummary[],
  clientPhoneById: Map<string, string | null>
): PendingRow[] {
  const now = nowAsWallClock().getTime()
  const rows: PendingRow[] = []
  for (const p of projects) {
    const balance = calculateBalance(p)
    if (balance <= 0) continue
    const next = nextSession(p)
    const dueDate = next ? new Date(next.scheduled_at) : null
    let status: PendingRow['status'] = 'al-dia'
    if (dueDate) {
      const diffDays = (dueDate.getTime() - now) / 86_400_000
      if (diffDays < 0) status = 'vencido'
      else if (diffDays <= 3) status = 'proximo'
    }
    rows.push({
      projectId: p.id,
      clientName: p.clients?.name ?? 'Cliente',
      balance,
      dueDate,
      status,
      clientPhone: clientPhoneById.get(p.client_id) ?? null,
    })
  }
  return rows.sort((a, b) => b.balance - a.balance)
}

export type CashflowRow = { day: string; label: string; amount: number }

/** Flujo de caja: ingreso esperado por cada sesión agendada en los próximos
 * `daysAhead` días. Como no existe un monto "por sesión" real en la BD, se
 * estima repartiendo `total_value` del proyecto entre sus sesiones
 * (`total_value / session_count`) — aproximación explícita, no un dato
 * inventado de la nada. Solo sesiones de proyectos con saldo pendiente. */
export function cashflowByDay(
  sessions: SessionWithProject[],
  projects: ProjectSummary[],
  todayKeyStr: string,
  daysAhead = 7
): CashflowRow[] {
  const projectById = new Map(projects.map((p) => [p.id, p]))
  const from = new Date(`${todayKeyStr}T00:00:00Z`)
  const totals = new Map<string, number>()

  for (const s of sessions) {
    if (s.status === 'cancelled') continue
    const key = dayKey(s.scheduled_at)
    if (key < todayKeyStr) continue
    const diffDays = (new Date(`${key}T00:00:00Z`).getTime() - from.getTime()) / 86_400_000
    if (diffDays > daysAhead) continue
    const project = projectById.get(s.project_id)
    if (!project) continue
    const balance = calculateBalance(project)
    if (balance <= 0) continue
    const perSession = project.session_count && project.session_count > 0
      ? (project.total_value ?? 0) / project.session_count
      : balance
    totals.set(key, (totals.get(key) ?? 0) + Math.min(perSession, balance))
  }

  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, amount]) => ({ day: key, label: cashflowDayLabel(key, todayKeyStr), amount: Math.round(amount) }))
}

function cashflowDayLabel(key: string, todayKeyStr: string): string {
  const today = new Date(`${todayKeyStr}T00:00:00Z`)
  const d = new Date(`${key}T00:00:00Z`)
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  return d.toLocaleDateString('es-CO', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
}

export type RevenueRanking = { label: string; amount: number; pct: number }

/** Servicios (estilo) más rentables del mes — por facturación real
 * (`quotes.price`), no por cantidad de pedidos. */
export function topServicesByRevenue(monthQuotes: QuoteWithClient[], top = 5): RevenueRanking[] {
  const totals = new Map<string, number>()
  for (const q of monthQuotes) {
    if (!q.style || q.price == null) continue
    totals.set(q.style, (totals.get(q.style) ?? 0) + q.price)
  }
  return rankByAmount(totals, top)
}

export type TopClient = {
  clientId: string
  name: string
  totalInvested: number
  projectCount: number
  lastVisit: Date | null
}

/** Clientes más importantes por facturación total (todos los pagos
 * confirmados, no solo este mes) — no por cantidad de proyectos. */
export function topClientsByRevenue(projects: ProjectSummary[], top = 5): TopClient[] {
  const byClient = new Map<string, TopClient>()
  for (const p of projects) {
    if (!p.client_id) continue
    const paid = p.payments.reduce((sum, pay) => sum + (pay.amount ?? 0), 0)
    const lastSession = [...p.sessions]
      .filter((s) => s.status === 'completed')
      .map((s) => new Date(s.scheduled_at))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    const existing = byClient.get(p.client_id)
    if (existing) {
      existing.totalInvested += paid
      existing.projectCount += 1
      if (lastSession && (!existing.lastVisit || lastSession > existing.lastVisit)) {
        existing.lastVisit = lastSession
      }
    } else {
      byClient.set(p.client_id, {
        clientId: p.client_id,
        name: p.clients?.name ?? 'Cliente',
        totalInvested: paid,
        projectCount: 1,
        lastVisit: lastSession,
      })
    }
  }
  return [...byClient.values()]
    .filter((c) => c.totalInvested > 0)
    .sort((a, b) => b.totalInvested - a.totalInvested)
    .slice(0, top)
}

function rankByAmount(totals: Map<string, number>, top: number): RevenueRanking[] {
  const sum = [...totals.values()].reduce((s, v) => s + v, 0)
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, amount]) => ({ label, amount, pct: sum > 0 ? Math.round((amount / sum) * 100) : 0 }))
}

export type CajaTicketsSummary = {
  count: number
  total: number
  byMethod: { method: string; amount: number; count: number }[]
}

/** Resumen de "tickets" registrados desde el botón Caja de Inicio (cobros
 * con `payment_method` — los pagos hechos desde el detalle de proyecto no
 * llevan método y no cuentan aquí). Solo del mes en curso. */
export function cajaTicketsSummary(projects: ProjectSummary[], monthKey: string): CajaTicketsSummary {
  const byMethod = new Map<string, { amount: number; count: number }>()
  let count = 0
  let total = 0
  for (const p of projects) {
    for (const pay of p.payments) {
      if (pay.paid_at?.slice(0, 7) !== monthKey) continue
      if (!pay.payment_method) continue
      count += 1
      total += pay.amount
      const entry = byMethod.get(pay.payment_method) ?? { amount: 0, count: 0 }
      entry.amount += pay.amount
      entry.count += 1
      byMethod.set(pay.payment_method, entry)
    }
  }
  return {
    count,
    total,
    byMethod: [...byMethod.entries()]
      .map(([method, v]) => ({ method, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount),
  }
}
