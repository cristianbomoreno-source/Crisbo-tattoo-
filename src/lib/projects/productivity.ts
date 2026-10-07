import type { ProjectSummary } from '@/queries/projects'
import { dayKey } from '@/lib/calendar/utils'

export type Productivity = {
  /** Minutos de sesiones completadas en el mes. */
  tattooedMinutes: number
  /** Sesiones completadas en el mes. */
  sessionsDone: number
  /** Proyectos con estado 'completed' actualizados en el mes. */
  projectsFinished: number
  /** Minutos de sesiones del mes agendadas y aún no completadas (ni canceladas). */
  pendingMinutes: number
}

/** Productividad del mes a partir de los proyectos (con sus sesiones embebidas). */
export function productivityMetrics(monthKey: string, projects: ProjectSummary[]): Productivity {
  let tattooedMinutes = 0
  let sessionsDone = 0
  let pendingMinutes = 0

  for (const p of projects) {
    for (const s of p.sessions) {
      if (!dayKey(s.scheduled_at).startsWith(monthKey)) continue
      if (s.status === 'completed') {
        tattooedMinutes += s.duration_minutes
        sessionsDone += 1
      } else if (s.status !== 'cancelled') {
        pendingMinutes += s.duration_minutes
      }
    }
  }

  const projectsFinished = projects.filter(
    (p) => p.status === 'completed' && dayKey(p.updated_at).startsWith(monthKey),
  ).length

  return { tattooedMinutes, sessionsDone, projectsFinished, pendingMinutes }
}

/** Formato de horas: "42h 30m" · "27h" · "45m" · "0m". */
export function formatHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
