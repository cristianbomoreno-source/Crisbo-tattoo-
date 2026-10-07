import { ZONE_POINTS, BodySilhouette } from '@/lib/body-zones'
import type { RankingRow } from '@/lib/stats/period-metrics'

export function StatsZonesMap({ rows }: { rows: RankingRow[] }) {
  const maxPct = Math.max(1, ...rows.map((r) => r.pct))

  return (
    <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Zonas más elegidas
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aún no hay cotizaciones con zona este mes.</p>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <svg viewBox="0 0 200 420" className="h-40 w-auto shrink-0" fill="none" aria-hidden>
            <BodySilhouette />
            {rows.map((row) => {
              const p = ZONE_POINTS[row.label as keyof typeof ZONE_POINTS]
              if (!p) return null
              const r = 6 + (row.pct / maxPct) * 10
              return (
                <circle
                  key={row.label}
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="var(--primary)"
                  opacity={0.35 + 0.45 * (row.pct / maxPct)}
                />
              )
            })}
          </svg>
          <div className="min-w-0 flex-1 space-y-1.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-white/90">{row.label}</span>
                <span className="shrink-0 tabular-nums text-primary">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
