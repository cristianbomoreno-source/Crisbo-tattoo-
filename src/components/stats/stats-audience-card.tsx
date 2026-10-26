import type { GenderBreakdown, AgeBracket } from '@/lib/stats/period-metrics'
import { Columns, Donut } from '@/components/stats/charts'

export function StatsAudienceCard({ gender, age }: { gender: GenderBreakdown; age: { average: number | null; brackets: AgeBracket[] } }) {
  const hasData = gender.total > 0
  const hasAges = age.brackets.some((b) => b.count > 0)

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <h2 className="text-sm font-semibold">Tu público</h2>

      {!hasData ? (
        <p className="mt-3 text-[13px] text-muted-foreground">Sin datos de género o edad este mes.</p>
      ) : (
        <div className="mt-3 grid gap-5 lg:grid-cols-[auto_1fr] lg:items-end">
          <div className="flex items-center gap-4">
            <Donut
              segments={[
                { label: 'Mujeres', value: gender.mujeres, color: 'var(--primary)' },
                { label: 'Hombres', value: gender.hombres, color: 'var(--chart-3)' },
              ]}
              size={104}
              thickness={14}
              label={`Mujeres ${gender.pctMujeres}%, hombres ${gender.pctHombres}%`}
            >
              {age.average !== null && (
                <span>
                  <span className="block font-title text-xl font-bold tabular-nums">{age.average}</span>
                  <span className="text-[11px] text-muted-foreground">años</span>
                </span>
              )}
            </Donut>
            <ul className="space-y-1.5 text-[13px]">
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden />
                Mujeres <span className="tabular-nums text-muted-foreground">{gender.pctMujeres}%</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-chart-3" aria-hidden />
                Hombres <span className="tabular-nums text-muted-foreground">{gender.pctHombres}%</span>
              </li>
            </ul>
          </div>
          {hasAges && <Columns items={age.brackets.map((b) => ({ label: b.label, value: b.count }))} height={64} />}
        </div>
      )}
    </section>
  )
}
