import { getQuotes } from '@/queries/quotes'
import { getSessions } from '@/queries/sessions'
import { getProjects } from '@/queries/projects'
import { getClients } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { getExpenses } from '@/queries/expenses'
import { todayKey } from '@/lib/calendar/utils'
import {
  quotesInMonth,
  quotesInRange,
  confirmedIncome,
  confirmedIncomeInRange,
  hoursTattooed,
  hoursInRange,
  clientsBreakdown,
  clientsInRange,
  averageTicket,
  conversionPct,
} from '@/lib/stats/period-metrics'
import {
  financeHealth,
  pendingPayments,
  cashflowByDay,
  topServicesByRevenue,
  topClientsByRevenue,
  cajaTicketsSummary,
} from '@/lib/finance/metrics'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { FinanceDateFilter } from '@/components/finance/finance-date-filter'
import { FinanceReportSummary, type ReportData } from '@/components/finance/finance-report-summary'
import { FinanceHero } from '@/components/finance/finance-hero'
import { FinanceHealthCard } from '@/components/finance/finance-health'
import { FinanceGoalCard } from '@/components/finance/finance-goal'
import { FinanceCashflowCard } from '@/components/finance/finance-cashflow'
import { FinanceCajaCard } from '@/components/finance/finance-caja'
import { FinancePendingCard } from '@/components/finance/finance-pending'
import { FinanceProductionGrid } from '@/components/finance/finance-production'
import { FinanceTopServicesCard, FinanceTopClientsCard } from '@/components/finance/finance-rankings'
import { FinanceIncomeVsExpensesCard, FinanceExpensesDonut } from '@/components/finance/finance-expenses'

function getDefaultDates() {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const from = new Date(y, m, 1).toISOString().slice(0, 10)
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  return { from, to }
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  const defaults = getDefaultDates()
  const fromDate = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : defaults.from
  const toDate = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : defaults.to

  const monthKey = todayKey().slice(0, 7)

  // Ampliar rango de consulta para incluir datos necesarios
  const queryFrom = new Date(fromDate)
  queryFrom.setMonth(queryFrom.getMonth() - 1)
  const queryTo = new Date(toDate)
  queryTo.setDate(queryTo.getDate() + 14)

  const [quotesResult, sessionsResult, projectsResult, clientsResult, studio, expensesResult] = await Promise.all([
    getQuotes(),
    getSessions(queryFrom.toISOString(), queryTo.toISOString()),
    getProjects(),
    getClients(),
    getCurrentStudio(),
    getExpenses(fromDate, toDate),
  ])

  const quotes = quotesResult.success ? quotesResult.data : []
  const sessions = sessionsResult.success ? sessionsResult.data : []
  const projects = projectsResult.success ? projectsResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []
  const rangeExpenses = expensesResult.success ? expensesResult.data : []

  // Datos filtrados por el rango seleccionado
  const rangeQuotes = quotesInRange(quotes, fromDate, toDate)
  const revenue = rangeQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0)
  const collected = confirmedIncomeInRange(projects, fromDate, toDate)
  const pending = Math.max(0, revenue - collected)

  const approvedQuotes = rangeQuotes.filter((q) => q.status === 'approved')
  const pendingQuotes = rangeQuotes.filter((q) => q.status === 'quoted')
  const rejectedQuotes = rangeQuotes.filter((q) => q.status === 'rejected')

  const hoursData = hoursInRange(sessions, fromDate, toDate)
  const clientsData = clientsInRange(clients, rangeQuotes, fromDate, toDate)
  const avgTicket = averageTicket(rangeQuotes)
  const conversion = conversionPct(rangeQuotes)

  const totalExpenses = rangeExpenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = rangeExpenses.length > 0 ? collected - totalExpenses : null

  // Datos para el reporte
  const reportData: ReportData = {
    totalQuotes: rangeQuotes.length,
    quotedValue: revenue,
    approvedQuotes: approvedQuotes.length,
    approvedValue: approvedQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0),
    pendingQuotes: pendingQuotes.length,
    pendingValue: pendingQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0),
    rejectedQuotes: rejectedQuotes.length,
    conversionRate: conversion,
    confirmedIncome: collected,
    pendingIncome: pending,
    averageTicket: avgTicket,
    totalSessions: hoursData.sessionCount,
    completedSessions: hoursData.completedCount,
    hoursWorked: hoursData.hours,
    totalActiveClients: clientsData.total,
    newClients: clientsData.newClients.length,
    recurringClients: clientsData.recurringClients.length,
    totalExpenses,
    profit,
    fromDate,
    toDate,
  }

  // Datos para las tarjetas del mes actual (para mantener compatibilidad)
  const monthQuotes = quotesInMonth(quotes, monthKey)
  const monthRevenue = monthQuotes.reduce((sum, q) => sum + (q.price ?? 0), 0)
  const monthCollected = confirmedIncome(projects, monthKey)
  const monthPending = Math.max(0, monthRevenue - monthCollected)
  const collectedPct = monthRevenue > 0 ? Math.round((monthCollected / monthRevenue) * 100) : null

  const goal = studio?.monthlyGoalQuotedValue ?? null
  const goalProgressPct = goal && goal > 0 ? Math.round((monthRevenue / goal) * 100) : null

  const hours = hoursTattooed(sessions, monthKey)
  const { newClients } = clientsBreakdown(clients, monthQuotes, monthKey)
  const monthAvgTicket = averageTicket(monthQuotes)

  const clientPhoneById = new Map(clients.map((c) => [c.id, c.phone]))

  const monthExpenses = rangeExpenses.filter((e) => e.expense_date.slice(0, 7) === monthKey)
  const monthTotalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const monthProfit = monthExpenses.length > 0 ? monthCollected - monthTotalExpenses : null

  const expensesByCategory = Object.entries(
    rangeExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {})
  )
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <SettingsSubpage
      title="Finanzas"
      description="El estado financiero de tu estudio, en segundos."
    >
      <div className="space-y-4">
        <FinanceDateFilter currentFrom={fromDate} currentTo={toDate} />

        <FinanceReportSummary data={reportData} />

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Vista del mes actual</p>
        </div>

        <FinanceHero revenue={monthRevenue} collected={monthCollected} pending={monthPending} profit={monthProfit} />
        <FinanceHealthCard health={financeHealth(collectedPct, goalProgressPct)} />
        {goal != null && goal > 0 && <FinanceGoalCard goal={goal} revenue={monthRevenue} />}
        <FinanceCashflowCard rows={cashflowByDay(sessions, projects, todayKey())} />
        <FinanceCajaCard summary={cajaTicketsSummary(projects, monthKey)} />
        <FinancePendingCard
          rows={pendingPayments(projects, clientPhoneById)}
          template={studio?.reminderBalanceTemplate}
        />
        <FinanceProductionGrid
          hours={hours.hours}
          sessionCount={hours.sessionCount}
          newClients={newClients.length}
          avgTicket={monthAvgTicket}
          valuePerHour={hours.hours > 0 ? monthCollected / hours.hours : 0}
        />
        {rangeExpenses.length > 0 && (
          <>
            <FinanceIncomeVsExpensesCard income={collected} expenses={totalExpenses} />
            <FinanceExpensesDonut totals={expensesByCategory} />
          </>
        )}
        <FinanceTopServicesCard rows={topServicesByRevenue(rangeQuotes)} />
        <FinanceTopClientsCard rows={topClientsByRevenue(projects)} />
      </div>
    </SettingsSubpage>
  )
}
