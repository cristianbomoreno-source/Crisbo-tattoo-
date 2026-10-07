'use client'

import { CircleDollarSign } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { CajaButton } from '@/components/home/caja-button'
import type { DaySummary as DaySummaryData } from '@/lib/home/day-metrics'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'

const R = 32
const CIRC = 2 * Math.PI * R

/** Anillo de progreso de 2 tramos (abonado / pendiente) sobre el total esperado. */
function Ring({ deposits, pending }: { deposits: number; pending: number }) {
  const total = deposits + pending || 1
  const depositsLen = (deposits / total) * CIRC
  return (
    <svg viewBox="0 0 80 80" className="size-[4.5rem] shrink-0 -rotate-90">
      <circle cx={40} cy={40} r={R} fill="none" stroke="var(--accent)" strokeWidth={9} />
      <circle
        cx={40}
        cy={40}
        r={R}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={`${depositsLen} ${CIRC - depositsLen}`}
      />
    </svg>
  )
}

/** Panel de dinero del día: proyectos con >=1 cita hoy, más el acceso a
 * "Caja" como acción principal integrada (antes era un botón aparte
 * ocupando su propia fila) — parte de la compactación de Inicio para que
 * quepa todo en una pantalla sin scroll. */
export function DaySummary({
  summary,
  projects,
  todaySessions,
  paymentMethods,
}: {
  summary: DaySummaryData
  projects: ProjectSummary[]
  todaySessions: SessionWithProject[]
  paymentMethods?: string[] | null
}) {
  const rows = [
    { label: 'Ingresos', value: summary.expected, dot: 'bg-foreground' },
    { label: 'Abonos recibidos', value: summary.deposits, dot: 'bg-primary' },
    { label: 'Pendiente', value: summary.pending, dot: 'bg-muted-foreground' },
  ]

  return (
    <section className="space-y-3 rounded-[1.5rem] bg-card p-3.5 sm:p-5">
      <h2 className="text-base font-semibold">Resumen del día</h2>

      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <Ring deposits={summary.deposits} pending={summary.pending} />
          <span className="absolute inset-0 grid place-items-center text-primary">
            <CircleDollarSign className="size-5" strokeWidth={2} />
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span className={`size-1.5 shrink-0 rounded-full ${r.dot}`} />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{cop(r.value)}</span>
            </div>
          ))}
        </div>
        <CajaButton projects={projects} todaySessions={todaySessions} paymentMethods={paymentMethods} />
      </div>
    </section>
  )
}
