import { Wallet } from 'lucide-react'
import type { CajaTicketsSummary } from '@/lib/finance/metrics'
import { cop } from '@/lib/projects/metrics'

/** Resumen de los cobros registrados este mes desde el botón "Caja" de
 * Inicio (cada uno queda como un ticket con método de pago). */
export function FinanceCajaCard({ summary }: { summary: CajaTicketsSummary }) {
  if (summary.count === 0) return null

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Wallet className="size-4 text-primary" strokeWidth={1.8} aria-hidden />
        Resumen de caja — este mes
      </h3>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {summary.count} {summary.count === 1 ? 'ticket registrado' : 'tickets registrados'}
        </span>
        <span className="font-display text-lg font-semibold tabular-nums text-primary">
          {cop(summary.total)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {summary.byMethod.map((m) => (
          <div key={m.method} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {m.method} <span className="text-xs">· {m.count}</span>
            </span>
            <span className="font-semibold tabular-nums">{cop(m.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
