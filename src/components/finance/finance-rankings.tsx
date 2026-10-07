import type { RevenueRanking, TopClient } from '@/lib/finance/metrics'
import { cop } from '@/lib/projects/metrics'

export function FinanceTopServicesCard({ rows }: { rows: RevenueRanking[] }) {
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.amount))

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Servicios más rentables
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-white">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">{cop(r.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                style={{ width: `${max > 0 ? (r.amount / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

export function FinanceTopClientsCard({ rows }: { rows: TopClient[] }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Clientes más importantes
      </h3>
      <div className="mt-4 flex flex-col gap-2.5">
        {rows.map((c) => (
          <div key={c.clientId} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 font-heading text-xs text-white">
              {initials(c.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.projectCount} proyecto{c.projectCount === 1 ? '' : 's'}
                {c.lastVisit && ` · última visita ${c.lastVisit.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-white">
              {cop(c.totalInvested)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
