import type { ProjectSummary } from '@/queries/projects'
import { nowAsWallClock } from '@/lib/calendar/utils'

/** Saldo pendiente = valor total − pagos registrados. */
export function calculateBalance(project: ProjectSummary): number {
  const paid = project.payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  return (project.total_value ?? 0) - paid
}

/** Sesiones totales/completadas y porcentaje de avance. */
export function getSessionStats(project: ProjectSummary): {
  total: number
  done: number
  pct: number
} {
  const total = project.sessions.length
  const done = project.sessions.filter((s) => s.status === 'completed').length
  const pct =
    total > 0
      ? Math.round((done / total) * 100)
      : project.status === 'completed'
        ? 100
        : 0
  return { total, done, pct }
}

/** Próxima sesión agendada (futura, no cancelada) o null. */
export function nextSessionAt(project: ProjectSummary): Date | null {
  const now = nowAsWallClock().getTime()
  const upcoming = project.sessions
    .filter(
      (s) =>
        s.scheduled_at &&
        s.status !== 'cancelled' &&
        new Date(s.scheduled_at).getTime() >= now
    )
    .map((s) => new Date(s.scheduled_at))
    .sort((a, b) => a.getTime() - b.getTime())
  return upcoming[0] ?? null
}

/** Próxima sesión agendada (futura, no cancelada) con sus datos, o null. */
export function nextSession(
  project: ProjectSummary
): { id: string; scheduled_at: string; duration_minutes: number } | null {
  const now = nowAsWallClock().getTime()
  const upcoming = [...project.sessions]
    .filter(
      (s) =>
        s.scheduled_at &&
        s.status !== 'cancelled' &&
        new Date(s.scheduled_at).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
  const n = upcoming[0]
  return n
    ? { id: n.id, scheduled_at: n.scheduled_at, duration_minutes: n.duration_minutes }
    : null
}

/** true si el proyecto tiene al menos una sesión (no cancelada) agendada dentro del mes calendario actual. */
export function hasSessionThisMonth(project: ProjectSummary): boolean {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return project.sessions.some((s) => {
    if (s.status === 'cancelled') return false
    const d = new Date(s.scheduled_at)
    return d.getFullYear() === y && d.getMonth() === m
  })
}

/** URL de la última foto subida del proyecto (cualquier etapa), o null. */
export function latestPhotoUrl(
  gallery: { url: string; created_at: string }[] | undefined,
): string | null {
  if (!gallery || gallery.length === 0) return null
  const latest = [...gallery].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  return latest?.url ?? null
}

/** Moneda COP canónica: $1.200.000 */
export const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

/** Moneda COP abreviada para espacios estrechos: $8,4M · $850K · $1.200. */
export function copShort(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) {
    const m = Math.floor((n / 1_000_000) * 10) / 10
    return `$${(m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)).replace('.', ',')}M`
  }
  if (abs >= 10_000) {
    return `$${Math.round(n / 1_000)}K`
  }
  return cop(n)
}

/** Fecha compacta de sesión: "12 jul". */
export const formatSessionDate = (d: Date) =>
  d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

/** Suma de los pagos ligados a una sesión específica. */
export function sessionPaid(
  payments: { amount: number; session_id: string | null }[],
  sessionId: string
): number {
  return payments
    .filter((p) => p.session_id === sessionId)
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)
}
