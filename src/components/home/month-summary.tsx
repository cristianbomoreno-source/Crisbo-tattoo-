'use client'

import { TrendDown, TrendUp } from '@phosphor-icons/react'
import { cop } from '@/lib/projects/metrics'
import { deltaPct } from '@/lib/home/month-metrics'
import { CajaButton } from '@/components/home/caja-button'
import { TileGrid } from '@/components/ui/tile'
import type { MonthSummary } from '@/lib/home/day-metrics'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'

const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' })

/** Nombre del mes ("octubre") a partir de 'YYYY-MM'. */
function monthName(monthKey: string, offset = 0) {
  const [y, m] = monthKey.split('-').map(Number)
  return monthFmt.format(new Date(Date.UTC(Number(y), Number(m) - 1 + offset, 1)))
}

/** Portada de Inicio al estilo Apple Games: tarjeta grande con degradado y
 * brillo dorado y el logo de Crisbo, el dinero que entró este mes en grande, la comparación con
 * el mes anterior y la píldora "Registrar cobro". Debajo, dos tarjetas de
 * color: citas agendadas y cotizaciones en espera. */
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
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_80%_at_50%_0%,#9a6a2a_0%,#4a2f14_45%,#1a120a_100%)] px-5 pt-5 pb-6 text-center text-white">
        {/* Rayos de luz detrás del ícono, como la portada de Apple Games. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_50%_22%,rgb(255_214_150/0.10)_0deg_2deg,transparent_2deg_14deg)] [mask-image:radial-gradient(70%_60%_at_50%_22%,black,transparent)]"
        />
        {/* Logo sin filtro de sombra: en Safari el drop-shadow dejaba ver el
            recuadro de la imagen. El brillo dorado es un círculo difuminado detrás. */}
        <div className="relative mx-auto grid size-24 place-items-center">
          <span aria-hidden="true" className="absolute inset-2 rounded-full bg-[#f3c98a]/35 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cb-isotipo-mark.png" alt="Crisbo Tattoo" draggable={false} className="relative h-24 w-auto select-none" />
        </div>
        <p className="relative mt-2 text-[13px] font-bold tracking-[0.08em] text-[#f3c98a] uppercase">Entró en {monthName(monthKey)}</p>
        <p className="relative mt-1 font-title text-[2.75rem] leading-none font-bold tracking-tight tabular-nums">{cop(summary.income)}</p>
        {delta !== null ? (
          <p className="relative mt-2 inline-flex items-center gap-1 text-[1.0625rem] text-white/75">
            {up ? <TrendUp className="size-4" weight="bold" /> : <TrendDown className="size-4" weight="bold" />}
            {up ? '+' : ''}
            {delta}% que en {monthName(monthKey, -1)}
          </p>
        ) : (
          <p className="relative mt-2 text-[1.0625rem] text-white/75">Pagos registrados este mes</p>
        )}
        <div className="relative mt-5">
          <CajaButton pill projects={projects} todaySessions={todaySessions} paymentMethods={paymentMethods} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <TileGrid
          href="/dashboard?openCalendar=1"
          tone="indigo"
          icon="spiral-calendar"
          subtitle={summary.upcoming > 0 ? `${summary.upcoming} por venir` : 'Ninguna por venir'}
          title={`${summary.scheduled} ${summary.scheduled === 1 ? 'cita' : 'citas'}`}
        />
        <TileGrid
          href="/dashboard/quotes"
          tone="sunset"
          icon="clipboard"
          subtitle={summary.newQuotes > 0 ? `${summary.newQuotes} sin responder` : 'Todas respondidas'}
          title={`${summary.waitingQuotes} en espera`}
        />
      </div>
    </div>
  )
}
