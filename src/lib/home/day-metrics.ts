import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'

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
