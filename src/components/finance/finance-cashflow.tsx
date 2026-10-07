import { TrendingUp } from 'lucide-react'
import type { CashflowRow } from '@/lib/finance/metrics'
import { cop } from '@/lib/projects/metrics'

/** Solo dinero por entrar — nunca gastos, según el pedido. Estimado a partir
 * de las sesiones agendadas de proyectos con saldo pendiente. */
export function FinanceCashflowCard({ rows }: { rows: CashflowRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <TrendingUp className="size-4 text-primary" strokeWidth={1.8} aria-hidden />
        Flujo de caja — próximos ingresos
      </h3>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((r) => (
          <div key={r.day} className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] px-4 py-3.5">
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="font-display text-sm font-semibold tabular-nums text-primary">+{cop(r.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
