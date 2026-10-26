import type { RankingRow } from '@/lib/stats/period-metrics'
import { CHART_COLORS, Donut } from '@/components/stats/charts'

export function StatsStylesRanking({ rows }: { rows: RankingRow[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  const segments = rows.map((r, i) => ({
    label: r.label,
    value: r.count,
    color: CHART_COLORS[i % CHART_COLORS.length] ?? 'var(--primary)',
  }))

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Estilos</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted-foreground">Sin datos este mes.</p>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <Donut segments={segments} size={104} thickness={14} label={rows.map((r) => `${r.label} ${r.count}`).join(', ')}>
            <span className="font-title text-xl font-bold tabular-nums">{total}</span>
          </Donut>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
