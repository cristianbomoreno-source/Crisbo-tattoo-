import { PartyPopper } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'

/** Meta mensual (Ajustes → Metas → `monthly_goal_quoted_value`) vs.
 * facturación real del mes. Si no hay meta configurada, no se dibuja (no
 * se inventa un número). */
export function FinanceGoalCard({ goal, revenue }: { goal: number; revenue: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((revenue / goal) * 100)) : 0
  const remaining = Math.max(0, goal - revenue)
  const reached = pct >= 100

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-6">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Meta mensual
      </p>
      <p className="mt-1.5 font-title text-3xl tracking-tight text-white tabular-nums">{cop(goal)}</p>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, boxShadow: '0 0 10px var(--primary)' }}
        />
      </div>
      <p className="mt-1.5 text-right font-display text-xs font-semibold tabular-nums text-primary">{pct}%</p>

      {reached ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <PartyPopper className="size-4 shrink-0" aria-hidden />
          ¡Meta alcanzada este mes! 🎉
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Solo faltan <span className="font-semibold text-white">{cop(remaining)}</span> para alcanzar tu objetivo.
        </p>
      )}
    </div>
  )
}
