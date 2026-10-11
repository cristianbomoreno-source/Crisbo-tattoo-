import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import { calculateBalance } from '@/lib/projects/metrics'
import { dayKey } from '@/lib/calendar/utils'
import { isProjectFullyPaid } from '@/lib/sessions/paid'

/** Conteo de sesiones (no canceladas) por día. `paid`: hay citas ese día y
 * todas son de proyectos ya pagados por completo (se pinta en verde). */
export function weekCounts(
  weekKeys: string[],
  sessions: SessionWithProject[]
): { key: string; count: number; paid: boolean }[] {
  return weekKeys.map((key) => {
    const active = sessions.filter(
      (s) => s.status !== 'cancelled' && dayKey(s.scheduled_at) === key
    )
    return {
      key,
      count: active.length,
      paid: active.length > 0 && active.every((s) => isProjectFullyPaid(s.projects)),
    }
  })
}

/** Saldo pendiente total (suma de saldos positivos de los proyectos dados). */
export function pendingBalanceTotal(projects: ProjectSummary[]): number {
  return projects.reduce((sum, p) => sum + Math.max(0, calculateBalance(p)), 0)
}
