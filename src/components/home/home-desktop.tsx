import { HomeHero } from '@/components/home/home-hero'
import { NextSessionCard } from '@/components/home/next-session-card'
import { CalendarCard } from '@/components/home/calendar-card'
import { DaySummary } from '@/components/home/day-summary'
import { TodayAppointments, type ProjectBalance } from '@/components/home/today-appointments'
import { PendingImportantCard } from '@/components/home/pending-important-card'
import { ExpenseAlertsCard } from '@/components/home/expense-alerts-card'
import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import type { DaySummary as DaySummaryData } from '@/lib/home/day-metrics'
import type { InventoryItem } from '@/queries/inventory'
import type { UpcomingExpenseAlert } from '@/lib/finance/alerts'

/**
 * Home EXCLUSIVO para iPad/escritorio (`hidden md:block`, ver
 * `dashboard/page.tsx`) — la versión móvil (`md:hidden`) no se toca. Mismo
 * dato, mismo estado, mismas consultas: solo reorganiza lo que
 * `DashboardPage` ya calculó, en un layout premium de portada + jornada +
 * dos columnas (70/30). Nada de estadísticas históricas aquí — eso vive en
 * `/dashboard/stats`.
 *
 * Jerarquía: 1) Portada  2) Iniciar sesión (dentro del hero)  3) Próxima
 * sesión  4) Calendario  5) Sesiones de hoy  6) Resumen del día
 * 7) Pendientes importantes.
 *
 * Botón ▶ por CITA: antes "Iniciar sesión" era solo la jornada general del
 * hero (una sola por día). Ahora cada cita de "Sesiones de hoy" tiene su
 * propio botón ▶/■ (popup de materiales → cronómetro → descuenta
 * inventario) — la jornada general del hero sigue existiendo aparte, para
 * quien solo quiera marcar cuándo llegó al estudio sin atarlo a una cita.
 */
export type HomeDesktopProps = {
  name: string | null
  greeting: string
  dateLabel: string
  coverPhotoUrl: string | null
  activeShift: { id: string; startedAt: string } | null
  todayOrdered: SessionWithProject[]
  photoUrls: Record<string, string | null>
  initialIndex: number
  reminderSessionTemplate?: string | null
  days: { key: string; count: number }[]
  today: string
  todaySessions: SessionWithProject[]
  balances: Record<string, ProjectBalance>
  blockedDays: string[]
  summary: DaySummaryData
  pendingQuotes: number
  pendingConsents: number
  unscheduledApproved: number
  inventoryItems?: InventoryItem[]
  activeSessionShifts?: Record<string, { id: string; startedAt: string }>
  projects: ProjectSummary[]
  paymentMethods?: string[] | null
  medicalAlertProjectIds?: Set<string>
  consentSignedProjectIds?: Set<string>
  expenseAlerts?: UpcomingExpenseAlert[]
}

export function HomeDesktop({
  name,
  greeting,
  dateLabel,
  coverPhotoUrl,
  activeShift,
  todayOrdered,
  photoUrls,
  initialIndex,
  reminderSessionTemplate,
  days,
  today,
  todaySessions,
  balances,
  blockedDays,
  summary,
  pendingQuotes,
  pendingConsents,
  unscheduledApproved,
  inventoryItems = [],
  activeSessionShifts = {},
  projects,
  paymentMethods,
  medicalAlertProjectIds,
  consentSignedProjectIds,
  expenseAlerts = [],
}: HomeDesktopProps) {
  return (
    <div className="space-y-6">
      <div data-tour="home-greeting">
        <HomeHero
          name={name}
          greeting={greeting}
          dateLabel={dateLabel}
          coverPhotoUrl={coverPhotoUrl}
          activeShift={activeShift}
        />
      </div>

      {todayOrdered.length > 0 && (
        <NextSessionCard
          sessions={todayOrdered}
          photoUrls={photoUrls}
          initialIndex={initialIndex}
          template={reminderSessionTemplate}
          inventoryItems={inventoryItems}
          activeShifts={activeSessionShifts}
          consentSignedProjectIds={consentSignedProjectIds}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="space-y-6 lg:col-span-7">
          <CalendarCard
            days={days}
            today={today}
            todaySessions={todaySessions}
            balances={balances}
            blockedDays={blockedDays}
          />

          <section className="space-y-3" data-tour="home-today-sessions">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sesiones de hoy</h2>
              <a
                href="/dashboard?openCalendar=1"
                className="text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver agenda completa →
              </a>
            </div>
            <TodayAppointments
              sessions={todaySessions}
              balances={balances}
              enableTimer
              inventoryItems={inventoryItems}
              activeShifts={activeSessionShifts}
              medicalAlertProjectIds={medicalAlertProjectIds}
              consentSignedProjectIds={consentSignedProjectIds}
            />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <DaySummary
            summary={summary}
            projects={projects}
            todaySessions={todaySessions}
            paymentMethods={paymentMethods}
          />
          {expenseAlerts.length > 0 && (
            <ExpenseAlertsCard alerts={expenseAlerts} />
          )}
          <PendingImportantCard
            pendingQuotes={pendingQuotes}
            pendingConsents={pendingConsents}
            unscheduledApproved={unscheduledApproved}
          />
        </div>
      </div>
    </div>
  )
}
