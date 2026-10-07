'use client'

import { cop } from '@/lib/projects/metrics'

/** Anillo grande de progreso — mismo patrón visual que `ProgressRing` de
 * `studio-control-center.tsx`, a mayor escala para el hero. */
function CollectedRing({ pct }: { pct: number }) {
  const R = 52
  const C = 2 * Math.PI * R
  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px var(--primary))' }}
        />
      </svg>
      <span className="font-title text-2xl tabular-nums text-white">
        {pct}
        <span className="text-sm text-muted-foreground">%</span>
      </span>
    </div>
  )
}

/** Tarjeta hero — protagonista de la sección. `revenue` = facturación del
 * mes (suma de `quotes.price` de este mes, mismo criterio que ya usa
 * `/dashboard/stats`), `collected` = pagos confirmados este mes
 * (`confirmedIncome`). `pending` = lo que falta por cobrar de lo facturado.
 * `profit` = cobrado − gastos del mes (`null` si no hay gastos
 * registrados todavía — no se dibuja un 0 falso). */
export function FinanceHero({
  revenue,
  collected,
  pending,
  profit,
}: {
  revenue: number
  collected: number
  pending: number
  profit: number | null
}) {
  const collectedPct = revenue > 0 ? Math.round((collected / revenue) * 100) : 0

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-6">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Facturación del mes
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="font-title text-[2.6rem] leading-[0.95] tracking-tight text-white tabular-nums">
          {cop(revenue)}
        </p>
        <CollectedRing pct={collectedPct} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-4">
          <p className="text-xs text-muted-foreground">Cobrado</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-white">{cop(collected)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-4">
          <p className="text-xs text-muted-foreground">Pendiente</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-white">{cop(pending)}</p>
        </div>
        {profit !== null && (
          <div className="col-span-2 rounded-2xl bg-primary/10 p-4">
            <p className="text-xs text-primary/80">Utilidad estimada (cobrado − gastos del mes)</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-primary">{cop(profit)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
