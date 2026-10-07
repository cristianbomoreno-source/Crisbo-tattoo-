'use client'

import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Wallet, Clock, TrendingUp } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { ConfirmedIncomeDialog } from '@/components/stats/confirmed-income-dialog'
import type { MonthPayment } from '@/lib/stats/period-metrics'

function Card({
  icon: Icon,
  value,
  label,
  sublabel,
  className,
}: {
  icon: LucideIcon
  value: string
  label: string
  sublabel: string
  className?: string
}) {
  return (
    <div className={`rounded-[1.5rem] bg-card p-4 sm:p-5 ${className ?? ''}`}>
      <span className="grid size-9 place-items-center rounded-full bg-primary/10">
        <Icon className="size-4 text-primary" aria-hidden />
      </span>
      <p className="mt-3 font-title text-2xl tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-sm text-white/80">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
    </div>
  )
}

export function StatsSecondaryGrid({
  upcomingSessionsCount,
  confirmedIncome,
  pendingApprovalValue,
  occupancyPct,
  daysWithSessionOpen,
  workableDays,
  monthPayments,
  monthKey,
}: {
  upcomingSessionsCount: number
  confirmedIncome: number
  pendingApprovalValue: number
  occupancyPct: number
  daysWithSessionOpen: number
  workableDays: number
  monthPayments: MonthPayment[]
  monthKey: string
}) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card
        icon={CalendarDays}
        value={String(upcomingSessionsCount)}
        label="Sesiones programadas"
        sublabel="Hoy y próximas"
      />
      <ConfirmedIncomeDialog
        payments={monthPayments}
        total={confirmedIncome}
        monthKey={monthKey}
      >
        <Card
          icon={Wallet}
          value={cop(confirmedIncome)}
          label="Ingresos confirmados"
          sublabel="Pagos recibidos"
          className="cursor-pointer hover:bg-card/80 transition-colors"
        />
      </ConfirmedIncomeDialog>
      <Card
        icon={Clock}
        value={cop(pendingApprovalValue)}
        label="Pendiente de aprobar"
        sublabel="En espera del cliente"
      />
      <Card
        icon={TrendingUp}
        value={`${occupancyPct}%`}
        label="Ocupación del mes"
        sublabel={`${daysWithSessionOpen} / ${workableDays} días`}
      />
    </section>
  )
}
