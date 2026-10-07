import { getQuotes } from '@/queries/quotes'
import { getSessions } from '@/queries/sessions'
import { getProjects } from '@/queries/projects'
import { getClients } from '@/queries/clients'
import { getBlockedDayKeys } from '@/queries/blocked-days'
import { getCurrentStudio } from '@/queries/studio'
import { getFixedExpenses } from '@/queries/expenses'
import { monthMetrics, monthHeatmap, daysInMonth, sessionsInMonth, type StudioSchedule } from '@/lib/home/month-metrics'
import { todayKey, shiftMonth } from '@/lib/calendar/utils'
import { accentColorFor } from '@/lib/pdf/quote-template-data'
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
  upcomingSessions,
  genderBreakdown,
  ageStats,
} from '@/lib/stats/period-metrics'
import { calculateUpcomingExpenseAlerts, getSmartRecommendations } from '@/lib/finance/alerts'

import { StatsHero } from '@/components/stats/stats-hero'
import { StatsSummaryStrip } from '@/components/stats/stats-summary-strip'
import { StatsSecondaryGrid } from '@/components/stats/stats-secondary-grid'
import { StatsFunnel } from '@/components/stats/stats-funnel'
import { StatsTrendChart } from '@/components/stats/stats-trend-chart'
import { StatsInsightCards } from '@/components/stats/stats-insight-cards'
import { StatsRecommendations } from '@/components/stats/stats-recommendations'
import { StatsStylesRanking } from '@/components/stats/stats-styles-ranking'
import { StatsZonesMap } from '@/components/stats/stats-zones-map'
import { StatsHoursCard } from '@/components/stats/stats-hours-card'
import { StatsOccupancyCalendar } from '@/components/stats/stats-occupancy-calendar'
import { StatsObjectives } from '@/components/stats/stats-objectives'
import { StatsAudienceCard } from '@/components/stats/stats-audience-card'

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>
}) {
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

  const [quotesResult, sessionsResult, projectsResult, clientsResult, blockedKeys, studio, fixedExpensesResult] = await Promise.all([
    getQuotes(),
    getSessions(fromD.toISOString(), toD.toISOString()),
    getProjects(),
    getClients(),
    getBlockedDayKeys(fromD.toISOString().slice(0, 10), toD.toISOString().slice(0, 10)),
    getCurrentStudio(),
    getFixedExpenses(),
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
  const deltaQuotesPct =
    prevMonthQuotes.length > 0
      ? Math.round(((monthQuotes.length - prevMonthQuotes.length) / prevMonthQuotes.length) * 100)
      : null

  const approvedCount = monthQuotes.filter((q) => q.status === 'approved').length
  const prevApprovedCount = prevMonthQuotes.filter((q) => q.status === 'approved').length

  // ----- Series diarias para la gráfica -----
  const totalDays = daysInMonth(monthKey)
  const trendData = Array.from({ length: totalDays }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    const key = `${monthKey}-${day}`
    const dayQuotes = monthQuotes.filter((q) => q.created_at.slice(0, 10) === key)
    return {
      day: i + 1,
      quotes: dayQuotes.length,
      value: dayQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0),
    }
  })

  // ----- Derivados nuevos (todos sobre datos ya cargados, sin nuevas consultas) -----
  const funnel = salesFunnel(monthQuotes, sessionsInMonth(sessions, monthKey))
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
  const upcoming = upcomingSessions(sessions, todayKey())
  const heatCells = monthHeatmap(monthKey, sessions, blockedKeys, undefined, schedule)
  const gender = genderBreakdown(monthQuotes)
  const age = ageStats(monthQuotes)

  const accentColor = accentColorFor(studio?.quoteTemplateColor)

  // Calcular recomendaciones inteligentes
  const expenseAlerts = calculateUpcomingExpenseAlerts(fixedExpenses, 0)
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
    expenseAlerts
  )

  return (
    <div className="space-y-4">
      <StatsHero
        monthKey={monthKey}
        photoUrl={studio?.logoUrl ?? null}
        studioName={studio?.name ?? 'Tu estudio'}
        deltaQuotesPct={deltaQuotesPct}
        accentColor={accentColor}
        monthlyGoal={studio?.monthlyGoalQuotedValue ?? null}
        quotedValue={quotedValue}
      />

      <StatsSummaryStrip
        quotedValue={quotedValue}
        prevQuotedValue={prevQuotedValue}
        approvedCount={approvedCount}
        prevApprovedCount={prevApprovedCount}
        scheduledSessions={metrics.scheduledSessions}
        prevScheduledSessions={prev.scheduledSessions}
        occupancyPct={metrics.occupancyPct}
        prevOccupancyPct={prev.occupancyPct}
        daysWithSessionOpen={metrics.daysWithSessionOpen}
        workableDays={metrics.workableDays}
      />

      <StatsSecondaryGrid
        upcomingSessionsCount={upcoming.length}
        confirmedIncome={confirmed}
        pendingApprovalValue={pendingApproval}
        occupancyPct={metrics.occupancyPct}
        daysWithSessionOpen={metrics.daysWithSessionOpen}
        workableDays={metrics.workableDays}
        monthPayments={payments}
        monthKey={monthKey}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsFunnel stages={funnel} />
        <StatsTrendChart monthKey={monthKey} data={trendData} />
      </div>

      <StatsInsightCards
        conversionPct={conversion}
        expectedIncome={expected}
        newClients={newClients}
        recurringClients={recurringClients}
        averageTicket={avgTicket}
        prevAverageTicket={prevAvgTicket}
      />

      {recommendations.length > 0 && <StatsRecommendations recommendations={recommendations} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatsStylesRanking rows={styles} />
        <StatsZonesMap rows={zones} />
        <StatsHoursCard hours={hours.hours} avgPerSession={hours.avgPerSession} />
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
