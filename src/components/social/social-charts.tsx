import { cn } from '@/lib/utils'

/** Gráficos livianos (SVG/CSS, sin librerías) del análisis de redes. */

/** Alcance diario como área, con un punto en cada día que hubo publicación. */
export function ReachArea({ data, postDays }: { data: { day: string; reach: number }[]; postDays: Set<string> }) {
  const width = 600
  const height = 180
  const pad = { top: 8, bottom: 20 }
  const innerH = height - pad.top - pad.bottom
  const max = Math.max(1, ...data.map((d) => d.reach))
  const step = data.length > 1 ? width / (data.length - 1) : width
  const x = (i: number) => i * step
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.reach).toFixed(1)}`).join(' ')
  const area = `0,${pad.top + innerH} ${line} ${x(data.length - 1).toFixed(1)},${pad.top + innerH}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Alcance diario">
      <polygon points={area} fill="var(--primary)" opacity={0.15} />
      <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth={1.75} strokeLinejoin="round" />
      {data.map((d, i) =>
        postDays.has(d.day) ? <circle key={d.day} cx={x(i)} cy={y(d.reach)} r={3} fill="var(--foreground)" /> : null
      )}
      {data.map((d, i) =>
        d.day.endsWith('-01') || d.day.endsWith('-15') ? (
          <text
            key={`t${d.day}`}
            x={x(i)}
            y={height - 5}
            fontSize={10}
            textAnchor="middle"
            fill="color-mix(in oklab, var(--foreground) 45%, transparent)"
          >
            {Number(d.day.slice(8))}/{Number(d.day.slice(5, 7))}
          </text>
        ) : null
      )}
    </svg>
  )
}

/** Barras por mes, con una línea punteada opcional para la meta. */
export function MonthBars({
  items,
  goal,
  format,
  barClass = 'bg-primary/80',
}: {
  items: { label: string; value: number; highlight?: boolean }[]
  goal?: number | null
  format: (n: number) => string
  barClass?: string
}) {
  const max = Math.max(1, goal ?? 0, ...items.map((i) => i.value))
  return (
    <div className="relative">
      {goal ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-foreground/40"
          style={{ bottom: `calc(${(goal / max) * 6}rem + 1.3rem)` }}
        >
          <span className="absolute -top-4 right-0 rounded bg-card px-1 text-[10px] text-muted-foreground">
            Meta {format(goal)}
          </span>
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        {items.map((i) => (
          <div key={i.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="truncate text-[10px] tabular-nums text-muted-foreground">{i.value ? format(i.value) : ''}</span>
            <div className="flex h-24 w-full items-end">
              <div
                className={cn('w-full rounded-t-md', i.highlight ? 'bg-primary' : barClass)}
                style={{ height: `${i.value ? Math.max((i.value / max) * 100, 3) : 0}%` }}
              />
            </div>
            <span className="text-[11px] capitalize text-muted-foreground">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Barras apiladas por mes (p. ej. chats de WhatsApp + Instagram). */
export function StackedMonthBars({
  items,
  series,
}: {
  items: { label: string; values: number[] }[]
  series: { label: string; className: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.values.reduce((s, v) => s + v, 0)))
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        {items.map((i) => {
          const total = i.values.reduce((s, v) => s + v, 0)
          return (
            <div key={i.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">{total || ''}</span>
              <div className="flex h-24 w-full flex-col justify-end overflow-hidden rounded-t-md">
                {i.values.map((v, k) =>
                  v ? <div key={k} className={series[k]?.className} style={{ height: `${(v / max) * 100}%` }} /> : null
                )}
              </div>
              <span className="text-[11px] capitalize text-muted-foreground">{i.label}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-full', s.className)} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
