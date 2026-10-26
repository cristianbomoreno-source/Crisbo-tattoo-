import type { FunnelStage } from '@/lib/stats/period-metrics'

const SHORT: Record<string, string> = {
  Solicitudes: 'Solicitudes',
  'Cotizaciones enviadas': 'Cotizadas',
  Aprobadas: 'Aprobadas',
  'Sesiones agendadas': 'Agendadas',
  'Sesiones finalizadas': 'Hechas',
}

/**
 * Embudo como barras que se angostan: cada etapa mide lo que queda de la
 * primera, y el % de la derecha es cuántas pasaron desde la etapa anterior.
 */
export function StatsFunnel({ stages, conversionPct }: { stages: FunnelStage[]; conversionPct: number | null }) {
  const top = Math.max(1, stages[0]?.count ?? 0)

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Embudo</h2>
        {conversionPct !== null && (
          <p className="text-[12px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-primary">{conversionPct}%</span> aprobadas
          </p>
        )}
      </div>
      <ol className="mt-4 space-y-2">
        {stages.map((stage, i) => {
          const pct = (stage.count / top) * 100
          const prev = stages[i - 1]?.count ?? 0
          const step = i > 0 && prev > 0 && stage.count <= prev ? Math.round((stage.count / prev) * 100) : null
          return (
            <li key={stage.label} className="flex items-center gap-2.5">
              <span className="w-[4.75rem] shrink-0 truncate text-[13px] text-muted-foreground">{SHORT[stage.label] ?? stage.label}</span>
              <div className="h-7 flex-1 overflow-hidden rounded-lg bg-foreground/[0.06]">
                <div
                  className="h-full rounded-lg"
                  style={{
                    width: `${Math.max(stage.count > 0 ? 4 : 0, pct)}%`,
                    backgroundColor: `color-mix(in oklab, var(--primary) ${100 - i * 15}%, transparent)`,
                  }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-sm font-bold tabular-nums">{stage.count}</span>
              <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {step !== null ? `${step}%` : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
