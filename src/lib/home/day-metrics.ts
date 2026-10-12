import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import { dayKey } from '@/lib/calendar/utils'

/** Clientes distintos (por nombre) con cita hoy. */
export function todayClientCount(todaySessions: SessionWithProject[]): number {
  const set = new Set<string>()
  for (const s of todaySessions) {
    const name = s.projects?.clients?.name
    if (name) set.add(name)
  }
  return set.size
}

export type NextAppointment = {
  time: string
  clientName: string | null
  projectName: string | null
} | null

/** Próxima cita futura (>= nowIso), no cancelada, o null. */
export function nextAppointment(sessions: SessionWithProject[], nowIso: string): NextAppointment {
  const now = new Date(nowIso).getTime()
  const upcoming = sessions
    .filter((s) => s.status !== 'cancelled' && new Date(s.scheduled_at).getTime() >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const n = upcoming[0]
  if (!n) return null
  return {
    time: n.scheduled_at,
    clientName: n.projects?.clients?.name ?? null,
    projectName: n.projects?.name ?? null,
  }
}

export type DaySummary = { expected: number; deposits: number; pending: number }

/** Resumen de dinero del día: proyectos DISTINTOS con >=1 sesión hoy. */
export function daySummary(
  todaySessions: SessionWithProject[],
  projects: ProjectSummary[],
): DaySummary {
  const ids = new Set(todaySessions.map((s) => s.project_id))
  const todays = projects.filter((p) => ids.has(p.id))
  const expected = todays.reduce((sum, p) => sum + (p.total_value ?? 0), 0)
  const deposits = todays.reduce(
    (sum, p) => sum + p.payments.reduce((a, x) => a + (x.amount ?? 0), 0),
    0,
  )
  const pending = Math.max(0, expected - deposits)
  return { expected, deposits, pending }
}


export type MonthSummary = {
  /** Dinero ingresado: pagos registrados este mes (cualquier proyecto). */
  income: number
  /** Lo mismo del mes anterior, para la comparación. */
  prevIncome: number
  /** Citas no canceladas agendadas este mes. */
  scheduled: number
  /** De esas, las que aún no han pasado. */
  upcoming: number
  /** Cotizaciones sin cerrar: nuevas, revisadas o enviadas al cliente. */
  waitingQuotes: number
  /** De esas, las que nadie ha respondido todavía (estado `new`). */
  newQuotes: number
}

const WAITING_QUOTE_STATUSES = new Set(['new', 'reviewed', 'quoted'])

/** Mes anterior de 'YYYY-MM'. */
function prevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(Number(y), Number(m) - 2, 1))
  return d.toISOString().slice(0, 7)
}

/** Resumen del mes de Inicio: dinero ingresado, citas y cotizaciones en espera. */
export function monthSummary(
  monthKey: string,
  sessions: SessionWithProject[],
  projects: ProjectSummary[],
  quotes: { status: string | null }[],
  nowIso: string,
): MonthSummary {
  const prevKey = prevMonthKey(monthKey)
  let income = 0
  let prevIncome = 0
  for (const p of projects) {
    for (const pay of p.payments) {
      // paid_at es un instante real (now() al cobrar): se pasa a hora de Colombia.
      const key = new Date(new Date(pay.paid_at).getTime() - 5 * 3_600_000).toISOString().slice(0, 7)
      if (key.startsWith(monthKey)) income += pay.amount ?? 0
      else if (key.startsWith(prevKey)) prevIncome += pay.amount ?? 0
    }
  }
  const now = new Date(nowIso).getTime()
  const inMonth = sessions.filter((s) => s.status !== 'cancelled' && dayKey(s.scheduled_at).startsWith(monthKey))
  const waiting = quotes.filter((q) => q.status && WAITING_QUOTE_STATUSES.has(q.status))
  return {
    income,
    prevIncome,
    scheduled: inMonth.length,
    upcoming: inMonth.filter((s) => new Date(s.scheduled_at).getTime() >= now).length,
    waitingQuotes: waiting.length,
    newQuotes: waiting.filter((q) => q.status === 'new').length,
  }
}
