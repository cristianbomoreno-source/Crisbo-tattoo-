import { HomeGreeting } from '@/components/home/home-greeting'
import { WorkShiftCard } from '@/components/home/work-shift-card'
import { SectionTitle } from '@/components/shared/large-title'
import { NextSessionCard } from '@/components/home/next-session-card'
import type { MedicalAlert } from '@/queries/consent-links'
import { CalendarCard } from '@/components/home/calendar-card'
import { MonthSummaryCard } from '@/components/home/month-summary'
import { TodayAppointments, type ProjectBalance } from '@/components/home/today-appointments'
import { PendingImportantCard } from '@/components/home/pending-important-card'
import { ExpenseAlertsCard } from '@/components/home/expense-alerts-card'
import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import type { MonthSummary } from '@/lib/home/day-metrics'
import type { UpcomingExpenseAlert } from '@/lib/finance/alerts'

/**
 * Home EXCLUSIVO para iPad/escritorio (`hidden md:block`, ver
 * `dashboard/page.tsx`) — la versión móvil (`md:hidden`) no se toca. Mismo
 * dato, mismo estado, mismas consultas: solo reorganiza lo que
 * `DashboardPage` ya calculó, en un layout premium de portada + jornada +
 * dos columnas (70/30). Nada de estadísticas históricas aquí — eso vive en
 * `/dashboard/stats`.
 *
 * Estilo Apple Games (oct 2026): título grande "Inicio" en lugar de la portada
 * con foto; la jornada pasó a la columna derecha.
 * Jerarquía: 1) Título  2) Iniciar jornada  3) Próxima
 * sesión  4) Calendario  5) Sesiones de hoy  6) Resumen del mes
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
  logoUrl?: string | null
  activeShift: { id: string; startedAt: string } | null
  todayOrdered: SessionWithProject[]
  photoUrls: Record<string, string | null>
  initialIndex: number
  /** Hoy sin citas: `todayOrdered` trae la próxima cita y esto los días que faltan. */
  daysUntil?: number
  reminderSessionTemplate?: string | null
  days: { key: string; count: number }[]
  today: string
  todaySessions: SessionWithProject[]
  balances: Record<string, ProjectBalance>
  blockedDays: string[]
  monthKey: string
  summary: MonthSummary
  pendingQuotes: number
  pendingConsents: number
  unscheduledApproved: number
  projects: ProjectSummary[]
  paymentMethods?: string[] | null
  medicalAlertProjectIds?: Set<string>
  /** Detalle de la alerta médica por proyecto (tarjeta "Próxima sesión"). */
  medicalAlerts?: Record<string, MedicalAlert[]>
  expenseAlerts?: UpcomingExpenseAlert[]
}

export function HomeDesktop({
  name,
  greeting,
  dateLabel,
  logoUrl,
  activeShift,
  todayOrdered,
  photoUrls,
  initialIndex,
  daysUntil,
  reminderSessionTemplate,
  days,
  today,
  todaySessions,
  balances,
  blockedDays,
  monthKey,
  summary,
  pendingQuotes,
  pendingConsents,
  unscheduledApproved,
  projects,
  paymentMethods,
  medicalAlertProjectIds,
  medicalAlerts,
  expenseAlerts = [],
}: HomeDesktopProps) {
  return (
    <div className="space-y-6">
      <div data-tour="home-greeting">
        <HomeGreeting name={name} greeting={greeting} dateLabel={dateLabel} logoUrl={logoUrl} />
      </div>

      {todayOrdered.length > 0 && (
        <NextSessionCard
          key={daysUntil ? 'upcoming' : 'today'}
          daysUntil={daysUntil}
          sessions={todayOrdered}
          photoUrls={photoUrls}
          initialIndex={initialIndex}
          template={reminderSessionTemplate}
          balances={balances}
          medicalAlerts={medicalAlerts}
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
            <SectionTitle
              title="Hoy"
              subtitle={`${todaySessions.length} ${todaySessions.length === 1 ? 'cita' : 'citas'}`}
              action={
                <a href="/dashboard?openCalendar=1" className="rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold">
                  Ver agenda
                </a>
              }
            />
            <TodayAppointments
              sessions={todaySessions}
              balances={balances}
              medicalAlertProjectIds={medicalAlertProjectIds}
            />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <WorkShiftCard activeShift={activeShift} />
          <MonthSummaryCard
            monthKey={monthKey}
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
