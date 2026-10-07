import { Users2 } from 'lucide-react'
import type { GenderBreakdown, AgeBracket } from '@/lib/stats/period-metrics'

export function StatsAudienceCard({
  gender,
  age,
}: {
  gender: GenderBreakdown
  age: { average: number | null; brackets: AgeBracket[] }
}) {
  const hasData = gender.total > 0

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Tu público
        </p>
        <Users2 className="size-4 text-muted-foreground" aria-hidden />
      </div>

      {!hasData ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay cotizaciones con género/edad registrados este mes.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/90">Hombres</span>
                <span className="tabular-nums text-muted-foreground">
                  {gender.hombres} · {gender.pctHombres}%
                </span>
              </div>
              <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div className="h-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${gender.pctHombres}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-white/90">Mujeres</span>
                <span className="tabular-nums text-muted-foreground">
                  {gender.mujeres} · {gender.pctMujeres}%
                </span>
              </div>
              <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full bg-white/60 transition-[width] duration-700 ease-out"
                  style={{ width: `${gender.pctMujeres}%` }}
                />
              </div>
            </div>
            {age.average !== null && (
              <div className="shrink-0 border-l border-white/8 pl-4 text-center">
                <p className="font-title text-2xl tabular-nums text-white">{age.average}</p>
                <p className="text-[11px] text-muted-foreground">años en promedio</p>
              </div>
            )}
          </div>

          {age.brackets.some((b) => b.count > 0) && (
            <div className="mt-5 flex items-end gap-2 border-t border-white/8 pt-4">
              {age.brackets.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-white/8">
                    <div
                      className="w-full bg-primary transition-[height] duration-700 ease-out"
                      style={{ height: `${Math.max(4, b.pct)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
