import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import { calculateBalance } from '@/lib/projects/metrics'
import { dayKey } from '@/lib/calendar/utils'

/** Conteo de sesiones (no canceladas) por día de la semana. */
export function weekCounts(
  weekKeys: string[],
  sessions: SessionWithProject[]
): { key: string; count: number }[] {
  return weekKeys.map((key) => ({
    key,
    count: sessions.filter(
      (s) => s.status !== 'cancelled' && dayKey(s.scheduled_at) === key
    ).length,
  }))
}

/** Saldo pendiente total (suma de saldos positivos de los proyectos dados). */
export function pendingBalanceTotal(projects: ProjectSummary[]): number {
  return projects.reduce((sum, p) => sum + Math.max(0, calculateBalance(p)), 0)
}
