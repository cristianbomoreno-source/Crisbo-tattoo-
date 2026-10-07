import { getClients } from '@/queries/clients'
import { getQuotes } from '@/queries/quotes'
import { getSessions } from '@/queries/sessions'
import { getProjects } from '@/queries/projects'
import { getBlockedDayKeys } from '@/queries/blocked-days'
import { monthMetrics } from '@/lib/home/month-metrics'

export type SettingsMetrics = {
  clientsCount: number
  sessionsThisMonth: number
  incomeThisMonth: number
  conversionPct: number
}

/** Métricas resumidas del héroe del nuevo panel de Ajustes (clientes, citas
 * del mes, ingresos del mes, tasa de cierre). Reutiliza 100% queries/helpers
 * ya existentes (los mismos que Inicio/Estadísticas) — nada nuevo a nivel de
 * datos, solo se agregan acá para un solo fetch compacto.
 *
 * "Tasa de cierre": cotizaciones con estado 'approved' sobre el total de
 * cotizaciones creadas este mes (incluye 'new' — mismo criterio simple que
 * un tatuador entendería de un vistazo; no es la métrica de embudo más fina
 * de Estadísticas, que sí separa por etapa). */
export async function getSettingsMetrics(): Promise<SettingsMetrics> {
  const now = new Date()
  const monthKey = now.toISOString().slice(0, 7)
  const from = `${monthKey}-01`
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  const [clientsRes, quotesRes, sessionsRes, projectsRes, blockedDayKeys] = await Promise.all([
    getClients(),
    getQuotes(),
    getSessions(from, to),
    getProjects(),
    getBlockedDayKeys(from, to),
  ])

  const clientsCount = clientsRes.success ? clientsRes.data.length : 0
  const sessions = sessionsRes.success ? sessionsRes.data : []
  const projects = projectsRes.success ? projectsRes.data : []
  const metrics = monthMetrics(monthKey, sessions, projects, blockedDayKeys, today)

  const quotesThisMonth = quotesRes.success
    ? quotesRes.data.filter((q) => q.created_at.slice(0, 7) === monthKey)
    : []
  const approved = quotesThisMonth.filter((q) => q.status === 'approved').length
  const conversionPct = quotesThisMonth.length > 0 ? Math.round((approved / quotesThisMonth.length) * 100) : 0

  return {
    clientsCount,
    sessionsThisMonth: metrics.scheduledSessions,
    incomeThisMonth: metrics.projectedIncome,
    conversionPct,
  }
}
