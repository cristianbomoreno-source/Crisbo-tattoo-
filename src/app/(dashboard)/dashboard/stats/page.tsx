import { getQuotes } from '@/queries/quotes'
import { getSessions } from '@/queries/sessions'
import { getProjects } from '@/queries/projects'
import { getClients } from '@/queries/clients'
import { getBlockedDayKeys } from '@/queries/blocked-days'
import { getCurrentStudio } from '@/queries/studio'
import { getCashData, getFixedExpenses } from '@/queries/expenses'
import { cashSummary } from '@/lib/finance/cash-summary'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/validations/studio'
import { monthMetrics, monthHeatmap, daysInMonth, sessionsInMonth, type StudioSchedule } from '@/lib/home/month-metrics'
import { todayKey, shiftMonth, dayKey } from '@/lib/calendar/utils'
import {
  quotesInMonth,
  salesFunnel,
  conversionPct,
  expectedIncome,
  pendingApprovalValue,
  averageTicket,
  stylesRanking,
  zonesRanking,
  hoursTattooed,
  confirmedIncome,
  monthPayments,
  clientsBreakdown,
  genderBreakdown,
  ageStats,
} from '@/lib/stats/period-metrics'
import { alertsFromFixedItems, calculateUpcomingExpenseAlerts, getSmartRecommendations } from '@/lib/finance/alerts'

import { StatsHero } from '@/components/stats/stats-hero'
import { StatsKpiGrid } from '@/components/stats/stats-kpi-grid'
import { StatsFunnel } from '@/components/stats/stats-funnel'
import { StatsClientsCard } from '@/components/stats/stats-insight-cards'
import { StatsRecommendations } from '@/components/stats/stats-recommendations'
import { StatsStylesRanking } from '@/components/stats/stats-styles-ranking'
import { StatsZonesMap } from '@/components/stats/stats-zones-map'
import { StatsHoursCard } from '@/components/stats/stats-hours-card'
import { StatsOccupancyCalendar } from '@/components/stats/stats-occupancy-calendar'
import { StatsObjectives } from '@/components/stats/stats-objectives'
import { StatsAudienceCard } from '@/components/stats/stats-audience-card'
import { StatsTabs } from '@/components/social/stats-tabs'

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const monthKey = m && /^\d{4}-\d{2}$/.test(m) ? m : todayKey().slice(0, 7)
  const prevKey = shiftMonth(monthKey, -1)
  const [yy, mm] = monthKey.split('-')
  const year = Number(yy)
  const month0 = Number(mm) - 1
  const [prevYy, prevMm] = prevKey.split('-')
  const prevYear = Number(prevYy)
  const prevMonth0 = Number(prevMm) - 1

  // Mismo rango amplio que usaba /dashboard/calendar: desde el mes anterior
  // (para las métricas comparativas) hasta 7 días después del mes actual.
  const fromD = new Date(Date.UTC(prevYear, prevMonth0, 1))
  fromD.setUTCDate(fromD.getUTCDate() - 1)
  const toD = new Date(Date.UTC(year, month0 + 1, 0))
  toD.setUTCDate(toD.getUTCDate() + 7)

  const [quotesResult, sessionsResult, projectsResult, clientsResult, blockedKeys, studio, fixedExpensesResult, cashResult] =
    await Promise.all([
      getQuotes(),
      getSessions(fromD.toISOString(), toD.toISOString()),
      getProjects(),
      getClients(),
      getBlockedDayKeys(fromD.toISOString().slice(0, 10), toD.toISOString().slice(0, 10)),
      getCurrentStudio(),
      getFixedExpenses(),
      getCashData(),
    ])
  const quotes = quotesResult.success ? quotesResult.data : []
  const sessions = sessionsResult.success ? sessionsResult.data : []
  const projectsFull = projectsResult.success ? projectsResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []
  const fixedExpenses = fixedExpensesResult.success
    ? fixedExpensesResult.data
        .filter((e) => e.due_day !== null)
        .map((e) => ({
          id: e.id,
          name: e.category,
          amount: e.amount,
          due_day: e.due_day!,
        }))
    : []

  const schedule: StudioSchedule = {
    openDays: studio?.openDays ?? null,
    openTime: studio?.openTime ?? null,
    closeTime: studio?.closeTime ?? null,
  }
  const metrics = monthMetrics(monthKey, sessions, projectsFull, blockedKeys, todayKey(), schedule)
  const prev = monthMetrics(prevKey, sessions, projectsFull, blockedKeys, todayKey(), schedule)

  // ----- Cotizaciones del mes (actual y anterior, para deltas reales) -----
  const monthQuotes = quotesInMonth(quotes, monthKey)
  const prevMonthQuotes = quotesInMonth(quotes, prevKey)
  const quotedValue = monthQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0)
  const prevQuotedValue = prevMonthQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0)

  const approvedCount = monthQuotes.filter((q) => q.status === 'approved').length

  // ----- Series diarias para las gráficas -----
  const totalDays = daysInMonth(monthKey)
  const dayKeys = Array.from({ length: totalDays }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, '0')}`)
  const dailyQuoted = dayKeys.map((key) =>
    monthQuotes.filter((q) => q.created_at.slice(0, 10) === key).reduce((sum, q) => sum + (q.price ?? 0), 0),
  )
  const monthSessionsList = sessionsInMonth(sessions, monthKey)
  const dailySessions = dayKeys.map((key) => monthSessionsList.filter((s) => dayKey(s.scheduled_at) === key).length)

  // ----- Derivados nuevos (todos sobre datos ya cargados, sin nuevas consultas) -----
  const funnel = salesFunnel(monthQuotes, monthSessionsList)
  const conversion = conversionPct(monthQuotes)
  const expected = expectedIncome(monthQuotes)
  const pendingApproval = pendingApprovalValue(monthQuotes)
  const avgTicket = averageTicket(monthQuotes)
  const prevAvgTicket = averageTicket(prevMonthQuotes)
  const styles = stylesRanking(monthQuotes)
  const zones = zonesRanking(monthQuotes)
  const hours = hoursTattooed(sessions, monthKey)
  const confirmed = confirmedIncome(projectsFull, monthKey)
  const payments = monthPayments(projectsFull, monthKey)
  const { newClients, recurringClients } = clientsBreakdown(clients, monthQuotes, monthKey)
  const heatCells = monthHeatmap(monthKey, sessions, blockedKeys, undefined, schedule)
  const gender = genderBreakdown(monthQuotes)
  const age = ageStats(monthQuotes)

  // Plata acumulada día a día, este mes y el anterior, para la curva de la cabecera.
  const cumulativeOf = (list: { amount: number; paid_at: string }[], key: string) => {
    const n = daysInMonth(key)
    const perDay = Array.from({ length: n }, () => 0)
    for (const pay of list) {
      const d = Number(pay.paid_at.slice(8, 10))
      if (d >= 1 && d <= n) perDay[d - 1] = (perDay[d - 1] ?? 0) + pay.amount
    }
    let acc = 0
    return perDay.map((v) => (acc += v))
  }
  const prevPayments = monthPayments(projectsFull, prevKey)
  const cumulative = cumulativeOf(payments, monthKey)
  const prevCumulative = cumulativeOf(prevPayments, prevKey)
  const today = todayKey()
  const upToIndex = monthKey === today.slice(0, 7) ? Number(today.slice(8, 10)) - 1 : monthKey < today.slice(0, 7) ? totalDays - 1 : -1
  const prevIncome = prevCumulative[prevCumulative.length - 1] ?? 0
  const prevSameDay = upToIndex >= 0 ? (prevCumulative[Math.min(upToIndex, prevCumulative.length - 1)] ?? 0) : 0

  // Horas tatuadas por día de la semana (lunes primero).
  const weekdayIndex = (key: string) => (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7
  const hoursByWeekday = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, idx) => ({
    label,
    value:
      monthSessionsList.filter((s) => weekdayIndex(dayKey(s.scheduled_at)) === idx).reduce((sum, s) => sum + s.duration_minutes, 0) / 60,
  }))
  const pendingCount = monthQuotes.filter((q) => q.status === 'quoted').length

  // Calcular recomendaciones inteligentes
  // Con los pagos registrados, un gasto fijo ya pagado este mes no sale como urgente.
  const cash = cashResult.success
    ? cashSummary({
        ...cashResult.data,
        accounts: studio?.paymentMethods?.length ? studio.paymentMethods : [...PAYMENT_METHOD_OPTIONS],
        today: todayKey(),
      })
    : null
  const expenseAlerts = cash
    ? alertsFromFixedItems([...cash.fixedBusiness, ...cash.fixedPersonal])
    : calculateUpcomingExpenseAlerts(fixedExpenses, 0)
  const pendingPaymentsAmount = projectsFull.reduce((sum, p) => {
    const paid = p.payments.reduce((s, pay) => s + (pay.amount ?? 0), 0)
    return sum + Math.max(0, (p.total_value ?? 0) - paid)
  }, 0)
  const collectedPct = quotedValue > 0 ? Math.round((confirmed / quotedValue) * 100) : null
  const recommendations = getSmartRecommendations(
    {
      confirmedIncome: confirmed,
      quotedValue,
      monthlyGoal: studio?.monthlyGoalQuotedValue ?? null,
      pendingPayments: pendingPaymentsAmount,
      collectedPct,
      hoursWorked: hours.hours,
      sessionsThisMonth: metrics.scheduledSessions,
      availableMoney: 0,
    },
    expenseAlerts,
  )

  return (
    <div className="space-y-3">
      {studio?.role === 'owner' && <StatsTabs active="negocio" />}
      <StatsHero
        monthKey={monthKey}
        income={confirmed}
        prevIncome={prevIncome}
        prevSameDay={prevSameDay}
        cumulative={cumulative}
        prevCumulative={prevCumulative}
        upToIndex={upToIndex}
        payments={payments}
      />

      <StatsKpiGrid
        quotedValue={quotedValue}
        prevQuotedValue={prevQuotedValue}
        dailyQuoted={dailyQuoted}
        expectedIncome={expected}
        confirmedIncome={confirmed}
        pendingApprovalValue={pendingApproval}
        pendingCount={pendingCount}
        scheduledSessions={metrics.scheduledSessions}
        prevScheduledSessions={prev.scheduledSessions}
        dailySessions={dailySessions}
        upToIndex={upToIndex}
        occupancyPct={metrics.occupancyPct}
        daysWithSessionOpen={metrics.daysWithSessionOpen}
        workableDays={metrics.workableDays}
        averageTicket={avgTicket}
        prevAverageTicket={prevAvgTicket}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <StatsFunnel stages={funnel} conversionPct={conversion} />
        <StatsHoursCard hours={hours.hours} avgPerSession={hours.avgPerSession} byWeekday={hoursByWeekday} />
      </div>

      {recommendations.length > 0 && <StatsRecommendations recommendations={recommendations} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatsStylesRanking rows={styles} />
        <StatsZonesMap rows={zones} />
        <StatsClientsCard newClients={newClients} recurringClients={recurringClients} />
        <StatsOccupancyCalendar monthKey={monthKey} cells={heatCells} />
      </div>

      <StatsAudienceCard gender={gender} age={age} />

      <StatsObjectives
        quotedValue={quotedValue}
        quotedGoal={studio?.monthlyGoalQuotedValue ?? null}
        approvedCount={approvedCount}
        approvedGoal={studio?.monthlyGoalApprovedProjects ?? null}
        scheduledSessions={metrics.scheduledSessions}
        sessionsGoal={studio?.monthlyGoalScheduledSessions ?? null}
      />
    </div>
  )
}
