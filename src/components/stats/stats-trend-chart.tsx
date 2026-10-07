import { monthLabel, capitalize } from '@/lib/calendar/utils'
import { copShort } from '@/lib/projects/metrics'

type DayPoint = { day: number; quotes: number; value: number }

export function StatsTrendChart({ monthKey, data }: { monthKey: string; data: DayPoint[] }) {
  const width = 600
  const height = 220
  const padTop = 10
  const padBottom = 24
  const padLeft = 4
  const padRight = 4
  const innerH = height - padTop - padBottom
  const maxQuotes = Math.max(1, ...data.map((d) => d.quotes))
  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const n = data.length
  const step = n > 1 ? (width - padLeft - padRight) / n : width
  const barWidth = Math.max(2, step * 0.55)

  const linePoints = data
    .map((d, i) => {
      const x = padLeft + step * i + step / 2
      const y = padTop + innerH - (d.value / maxValue) * innerH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const tickEvery = n > 20 ? 5 : n > 10 ? 5 : 1

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Cotizaciones y valor cotizado
        </p>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-white/80">
          {capitalize(monthLabel(monthKey))}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" aria-hidden /> Cotizaciones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-3 bg-white/50" aria-hidden /> Valor cotizado
        </span>
      </div>

      <div className="mt-3 w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[480px]" preserveAspectRatio="none">
          {data.map((d, i) => {
            const x = padLeft + step * i + step / 2 - barWidth / 2
            const barH = Math.max(1, (d.quotes / maxQuotes) * innerH)
            const y = padTop + innerH - barH
            return (
              <rect
                key={d.day}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={1.5}
                fill={d.quotes > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}
                opacity={d.quotes > 0 ? 0.5 : 1}
              />
            )
          })}

          {maxValue > 0 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {maxValue > 0 &&
            data.map((d, i) => {
              if (d.value <= 0) return null
              const x = padLeft + step * i + step / 2
              const y = padTop + innerH - (d.value / maxValue) * innerH
              return <circle key={d.day} cx={x} cy={y} r={2.25} fill="white" />
            })}

          {data
            .filter((d) => d.day === 1 || d.day % tickEvery === 0)
            .map((d) => {
              const i = d.day - 1
              const x = padLeft + step * i + step / 2
              return (
                <text
                  key={d.day}
                  x={x}
                  y={height - 6}
                  fontSize={9}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                >
                  {d.day}
                </text>
              )
            })}
        </svg>
      </div>

      <p className="mt-1 text-right text-[11px] text-muted-foreground">
        Máx. {copShort(maxValue)} cotizado en un día
      </p>
    </section>
  )
}
