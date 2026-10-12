'use client'

import Link from 'next/link'
import { CalendarCheck, ChevronRight, FileClock, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cop } from '@/lib/projects/metrics'
import { deltaPct } from '@/lib/home/month-metrics'
import { CajaButton } from '@/components/home/caja-button'
import type { MonthSummary } from '@/lib/home/day-metrics'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'

const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' })

/** Nombre del mes ("octubre") a partir de 'YYYY-MM'. */
function monthName(monthKey: string, offset = 0) {
  const [y, m] = monthKey.split('-').map(Number)
  return monthFmt.format(new Date(Date.UTC(Number(y), Number(m) - 1 + offset, 1)))
}

/** Tarjeta "Resumen del mes" de Inicio: dinero ingresado (con la
 * comparación contra el mes anterior), citas agendadas y cotizaciones en
 * espera. Mantiene el botón "Caja" para registrar los cobros de hoy. */
export function MonthSummaryCard({
  monthKey,
  summary,
  projects,
  todaySessions,
  paymentMethods,
}: {
  monthKey: string
  summary: MonthSummary
  projects: ProjectSummary[]
  todaySessions: SessionWithProject[]
  paymentMethods?: string[] | null
}) {
  const delta = deltaPct(summary.income, summary.prevIncome)
  const up = delta !== null && delta >= 0

  return (
    <section className="space-y-3 rounded-[1.5rem] bg-card p-3.5 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Resumen del mes</h2>
        <span className="text-xs capitalize text-muted-foreground">{monthName(monthKey)}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Dinero ingresado</p>
          <p className="mt-0.5 truncate font-title text-[1.75rem] leading-tight font-bold tabular-nums">
            {cop(summary.income)}
          </p>
          {delta !== null ? (
            <p
              className={cn(
                'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium',
                up ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
              )}
            >
              {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {up ? '+' : ''}
              {delta}% vs {monthName(monthKey, -1)}
            </p>
          ) : (
            <p className="mt-1 text-[12px] text-muted-foreground">Pagos registrados este mes</p>
          )}
        </div>
        <CajaButton projects={projects} todaySessions={todaySessions} paymentMethods={paymentMethods} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          href="/dashboard?openCalendar=1"
          icon={CalendarCheck}
          value={summary.scheduled}
          label={summary.scheduled === 1 ? 'Cita agendada' : 'Citas agendadas'}
          detail={summary.upcoming > 0 ? `${summary.upcoming} por venir` : 'Ninguna por venir'}
        />
        <Stat
          href="/dashboard/quotes"
          icon={FileClock}
          value={summary.waitingQuotes}
          label={summary.waitingQuotes === 1 ? 'Cotización en espera' : 'Cotizaciones en espera'}
          detail={summary.newQuotes > 0 ? `${summary.newQuotes} sin responder` : 'Todas respondidas'}
          highlight={summary.newQuotes > 0}
        />
      </div>
    </section>
  )
}

function Stat({
  href,
  icon: Icon,
  value,
  label,
  detail,
  highlight,
}: {
  href: string
  icon: React.ElementType
  value: number
  label: string
  detail: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl bg-background/60 p-3 transition-colors hover:bg-accent/60"
    >
      <span className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-4" />
        </span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
      <span>
        <span className="block font-title text-xl leading-none font-bold tabular-nums">{value}</span>
        <span className="mt-1 block text-xs font-medium">{label}</span>
        <span className={cn('mt-0.5 block text-[12px]', highlight ? 'text-primary' : 'text-muted-foreground')}>
          {detail}
        </span>
      </span>
    </Link>
  )
}
