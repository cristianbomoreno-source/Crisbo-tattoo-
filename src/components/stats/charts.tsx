import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Gráficas de Estadísticas en SVG puro (sin librería): se dibujan en el
 * servidor, pesan nada y heredan los tokens de color del tema. Todas son
 * decorativas para lectores de pantalla salvo el `aria-label` que resume el
 * dato; el número importante siempre está también en texto al lado.
 */

/** Barritas por día para las tarjetas de KPI: una por día del mes, la más alta resaltada. */
export function DailyBars({ values, upToIndex, className }: { values: number[]; upToIndex?: number; className?: string }) {
  const max = Math.max(0, ...values)
  const last = upToIndex ?? values.length - 1
  return (
    <div className={cn('flex h-8 items-end gap-px', className)} aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn(
            'min-w-0 flex-1 rounded-[1px]',
            i > last ? 'bg-foreground/[0.04]' : v === 0 ? 'bg-foreground/10' : v === max ? 'bg-primary' : 'bg-primary/45'
          )}
          style={{ height: v > 0 && max > 0 ? `${Math.max(14, (v / max) * 100)}%` : '2px' }}
        />
      ))}
    </div>
  )
}

/** Línea recta punto a punto (para series acumuladas, que nunca bajan). */
function linePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

/**
 * Plata acumulada día a día: este mes (dorado, con área) contra el mes
 * anterior (línea punteada gris). Se corta en `upToIndex` para no dibujar
 * días que aún no pasan.
 */
export function CumulativeChart({
  current,
  previous,
  upToIndex,
  label,
}: {
  current: number[]
  previous: number[]
  upToIndex: number
  label: string
}) {
  const id = useId()
  const w = 320
  const h = 120
  const padTop = 10
  const padBottom = 4
  const days = Math.max(current.length, previous.length, 2)
  const shown = current.slice(0, upToIndex + 1)
  const max = Math.max(1, ...shown, ...previous)
  const x = (i: number) => (i / (days - 1)) * w
  const y = (v: number) => padTop + (h - padTop - padBottom) * (1 - v / max)

  const curPts = shown.map((v, i) => [x(i), y(v)] as [number, number])
  const prevPts = previous.map((v, i) => [x(i), y(v)] as [number, number])
  const curLine = linePath(curPts)
  const last = curPts[curPts.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full overflow-visible" role="img" aria-label={label}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={w}
          y1={padTop + (h - padTop - padBottom) * f}
          y2={padTop + (h - padTop - padBottom) * f}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {prevPts.length > 1 && (
        <path
          d={linePath(prevPts)}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}
      {curPts.length > 1 && last && (
        <>
          <path d={`${curLine} L${last[0]},${h} L0,${h} Z`} fill={`url(#${id})`} />
          <path d={curLine} fill="none" stroke="var(--primary)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r={7} fill="var(--primary)" opacity={0.18} />
          <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={1.5} />
        </>
      )}
    </svg>
  )
}

export type DonutSegment = { label: string; value: number; color: string }

/** Dona con los segmentos separados por una pequeña ranura. */
export function Donut({
  segments,
  size = 112,
  thickness = 12,
  children,
  label,
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  children?: React.ReactNode
  label: string
}) {
  const r = 50 - thickness / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  const visible = segments.filter((s) => s.value > 0)
  const gap = visible.length > 1 ? 2.2 : 0
  let offset = 0

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={label}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        {total > 0 &&
          visible.map((s) => {
            const len = (s.value / total) * c
            const dash = Math.max(0.01, len - gap)
            const el = (
              <circle
                key={s.label}
                cx={50}
                cy={50}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash.toFixed(2)} ${(c - dash).toFixed(2)}`}
                strokeDashoffset={(-offset).toFixed(2)}
                strokeLinecap="butt"
              />
            )
            offset += len
            return el
          })}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>}
    </div>
  )
}

/** Anillo de progreso (0–100). */
export function Ring({
  pct,
  size = 64,
  thickness = 9,
  color = 'var(--primary)',
  children,
  label,
}: {
  pct: number
  size?: number
  thickness?: number
  color?: string
  children?: React.ReactNode
  label: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  const r = 50 - thickness / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={label}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        {clamped > 0 && (
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${((clamped / 100) * c).toFixed(2)} ${c.toFixed(2)}`}
          />
        )}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>}
    </div>
  )
}

/** Columnas verticales con etiqueta abajo; la más alta va en dorado. */
export function Columns({
  items,
  height = 88,
  format,
}: {
  items: { label: string; value: number }[]
  height?: number
  format?: (n: number) => string
}) {
  const max = Math.max(0, ...items.map((i) => i.value))
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 34 }}>
      {items.map((it, i) => {
        const top = max > 0 && it.value === max
        const pct = max > 0 ? it.value / max : 0
        return (
          <div key={`${it.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                'text-[11px] tabular-nums leading-none',
                top ? 'font-semibold text-foreground' : 'text-muted-foreground',
                it.value === 0 && 'opacity-0',
              )}
            >
              {format ? format(it.value) : it.value}
            </span>
            <div className="flex w-full items-end" style={{ height }}>
              <div
                className={cn('mx-auto w-full max-w-9 rounded-md', top ? 'bg-primary' : it.value > 0 ? 'bg-foreground/25' : 'bg-foreground/8')}
                style={{ height: `${Math.max(4, pct * 100)}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[11px] leading-none text-muted-foreground">{it.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Variación contra el mes anterior en una píldora. */
export function DeltaChip({ pct, className }: { pct: number | null; className?: string }) {
  if (pct === null) return null
  const up = pct > 0
  const down = pct < 0
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none',
        up ? 'bg-income/15 text-income' : down ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {up ? '↑' : down ? '↓' : '='} {Math.abs(pct)}%
    </span>
  )
}

/** Paleta para gráficas con varias categorías (dorado primero, luego tierras y grises cálidos). */
export const CHART_COLORS: readonly string[] = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-5)',
  'color-mix(in oklab, var(--chart-1) 45%, var(--card))',
]
