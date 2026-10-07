'use client'

import { AlertTriangle, CalendarClock, TrendingUp } from 'lucide-react'
import type { UpcomingExpenseAlert } from '@/lib/finance/alerts'
import { cop } from '@/lib/projects/metrics'

type Props = {
  alerts: UpcomingExpenseAlert[]
}

export function ExpenseAlertsCard({ alerts }: Props) {
  if (alerts.length === 0) return null

  const urgentCount = alerts.filter((a) => a.status === 'urgent').length
  const warningCount = alerts.filter((a) => a.status === 'warning').length

  // Solo mostrar los primeros 3 más relevantes
  const visibleAlerts = alerts.slice(0, 3)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Gastos proximos</h2>
        {(urgentCount > 0 || warningCount > 0) && (
          <div className="flex gap-1.5">
            {urgentCount > 0 && (
              <span className="alert-badge-urgent rounded-full px-2 py-0.5 text-xs font-medium">
                {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="alert-badge-warning rounded-full px-2 py-0.5 text-xs font-medium">
                {warningCount} esta semana
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <ExpenseAlertRow key={alert.expense.id} alert={alert} />
        ))}
      </div>

      {alerts.length > 3 && (
        <p className="text-center text-xs text-muted-foreground">
          +{alerts.length - 3} gasto{alerts.length - 3 > 1 ? 's' : ''} mas
        </p>
      )}
    </section>
  )
}

function ExpenseAlertRow({ alert }: { alert: UpcomingExpenseAlert }) {
  const statusStyles = {
    urgent: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    ok: 'border-border bg-card',
  }

  const iconColors = {
    urgent: 'text-red-400',
    warning: 'text-amber-400',
    ok: 'text-muted-foreground',
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${statusStyles[alert.status]}`}
    >
      <span className={`shrink-0 ${iconColors[alert.status]}`}>
        {alert.status === 'urgent' ? (
          <AlertTriangle className="size-5" strokeWidth={1.8} />
        ) : (
          <CalendarClock className="size-5" strokeWidth={1.8} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{alert.expense.name}</p>
        <p className="text-xs text-muted-foreground">
          {alert.daysUntilDue === 0
            ? 'Vence hoy'
            : `Vence en ${alert.daysUntilDue} dia${alert.daysUntilDue > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-display text-sm font-semibold tabular-nums">
          {cop(alert.expense.amount)}
        </p>
        {alert.daysUntilDue > 0 && (
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3" />
            {cop(alert.dailyTargetToPayIt)}/dia
          </p>
        )}
      </div>
    </div>
  )
}
