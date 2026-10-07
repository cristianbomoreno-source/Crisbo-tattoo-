import type { RankingRow } from '@/lib/stats/period-metrics'

export function StatsStylesRanking({ rows }: { rows: RankingRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Estilos más solicitados
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aún no hay cotizaciones con estilo este mes.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/90">{row.label}</span>
                <span className="tabular-nums text-muted-foreground">{row.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
