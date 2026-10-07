import type { CurrentStudio } from '@/queries/studio'
import type { StudioHomeData } from '@/queries/studio-home'
import { CalendarCard } from '@/components/home/calendar-card'
import type { ProjectBalance } from '@/components/home/today-appointments'
import { EstudioGreeting } from '@/components/home/estudio/estudio-greeting'
import { EstudioQuickActions } from '@/components/home/estudio/quick-actions-bar'
import { WorkingTodayRow } from '@/components/home/estudio/working-today-row'
import { EstudioAgendaGrid } from '@/components/home/estudio/agenda-grid'
import { DaySummaryBar } from '@/components/home/estudio/day-summary-bar'
import { AlertsCard } from '@/components/home/estudio/alerts-card'
import { TeamStatusCard } from '@/components/home/estudio/team-status-card'
import { RecentActivityCard } from '@/components/home/estudio/recent-activity-card'
import { IncomeCard } from '@/components/home/estudio/income-card'

/**
 * Dashboard "Inicio" exclusivo para cuentas de Estudio (accountKind ===
 * 'estudio' && role === 'owner') — spec `OFINK — REDISEÑO COMPLETO DEL
 * DASHBOARD "INICIO" PARA CUENTA DE ESTUDIO DE TATUAJES`. Es una
 * herramienta de operación (qué está pasando HOY en todo el estudio), no
 * una adaptación del Home del tatuador independiente — ese sigue exacto
 * como está, en `dashboard/page.tsx` (esta es solo la rama 'estudio').
 */
export function EstudioHome({
  studio,
  data,
  greeting,
  dateLabel,
  days,
  today,
  blockedKeys,
}: {
  studio: CurrentStudio
  data: StudioHomeData
  greeting: string
  dateLabel: string
  days: { key: string; count: number }[]
  today: string
  blockedKeys: string[]
}) {
  const balances: Record<string, ProjectBalance> = {}
  // El donut/las cifras de dinero del día ya vienen agregadas en `data`;
  // `CalendarCard` solo necesita el mapa para no romper su tipo — sin
  // saldo por proyecto en esta vista (se ve en Proyectos/Finanzas).

  return (
    <div className="space-y-6 sm:space-y-7">
      <div data-tour="estudio-dashboard-overview">
        <EstudioGreeting
          studioName={data.studioName}
          greeting={greeting}
          dateLabel={dateLabel}
          logoUrl={studio.logoUrl}
          alertCount={data.alerts.length}
        />
      </div>

      <EstudioQuickActions />

      <CalendarCard
        days={days}
        today={today}
        todaySessions={data.todaySessions}
        balances={balances}
        blockedDays={blockedKeys}
      />

      <WorkingTodayRow team={data.team} />

      <div data-tour="estudio-agenda-grid">
        <EstudioAgendaGrid team={data.team} />
      </div>

      <DaySummaryBar
        citasHoy={data.citasHoy}
        tatuadoresActivos={data.tatuadoresActivos}
        pendientes={data.pendientes}
        canceladas={data.canceladas}
        proyectado={data.daySummaryData.expected}
      />

      <AlertsCard alerts={data.alerts} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamStatusCard team={data.team} />
        <RecentActivityCard items={data.recentActivity} />
      </div>

      <IncomeCard
        expected={data.daySummaryData.expected}
        deposits={data.daySummaryData.deposits}
        pending={data.daySummaryData.pending}
      />
    </div>
  )
}
