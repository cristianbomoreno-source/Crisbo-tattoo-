import type { ProjectSummary } from '@/queries/projects'
import { calculateBalance } from '@/lib/projects/metrics'

export type ClientAppointment = {
  id: string
  projectId: string
  projectName: string
  scheduledAt: string
  durationMinutes: number
  status: string
}

/** Totales del cliente: nº de proyectos, total pagado (Σ pagos) y saldo total
 * (Σ saldos por proyecto, cada uno vía `calculateBalance`). */
export function clientTotals(projects: ProjectSummary[]): {
  projectCount: number
  totalPaid: number
  totalBalance: number
} {
  let totalPaid = 0
  let totalBalance = 0
  for (const p of projects) {
    for (const pay of p.payments) totalPaid += pay.amount
    totalBalance += calculateBalance(p)
  }
  return { projectCount: projects.length, totalPaid, totalBalance }
}

/** Aplana las sesiones de TODOS los proyectos del cliente (con el nombre del
 * proyecto) y las parte en próximas y pasadas respecto a `now`. Las canceladas
 * NUNCA cuentan como próximas; una cancelada con fecha < now cae en pasadas
 * como registro histórico. Próximas ascendente (la más cercana primero),
 * pasadas descendente (la más reciente primero). */
export function clientAppointments(
  projects: ProjectSummary[],
  now: Date
): { upcoming: ClientAppointment[]; past: ClientAppointment[] } {
  const all: ClientAppointment[] = []
  for (const p of projects) {
    for (const s of p.sessions) {
      all.push({
        id: s.id,
        projectId: p.id,
        projectName: p.name,
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        status: s.status,
      })
    }
  }
  const nowMs = now.getTime()
  const upcoming = all
    .filter((a) => a.status !== 'cancelled' && new Date(a.scheduledAt).getTime() >= nowMs)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const past = all
    .filter((a) => new Date(a.scheduledAt).getTime() < nowMs)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  return { upcoming, past }
}
