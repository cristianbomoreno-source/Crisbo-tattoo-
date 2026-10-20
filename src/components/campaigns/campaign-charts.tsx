import { cn } from '@/lib/utils'

/** Gráficos livianos (SVG/CSS, sin librerías) para las estadísticas de campañas. */

export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

/** Tarjeta con título, gráfico y explicación debajo. */
export function ChartCard({
  title,
  explain,
  children,
  className,
}: {
  title: string
  explain?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5', className)}>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      {children}
      {explain && <p className="text-xs leading-relaxed text-muted-foreground">{explain}</p>}
    </section>
  )
}

/** Cifra grande con etiqueta. */
export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'primary' | 'good' }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-display text-xl font-semibold tabular-nums',
          tone === 'primary' && 'text-primary',
          tone === 'good' && 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

/** Embudo: cada paso como barra proporcional al primero. */
export function Funnel({ steps }: { steps: { label: string; value: number; className: string }[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1)
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{s.value}</span>
              {i > 0 && ` · ${pct(s.value, top)}%`}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', s.className)} style={{ width: `${Math.max(pct(s.value, top), s.value ? 2 : 0)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Dona con leyenda. Los colores van como clases `stroke-*` y `bg-*`. */
export function Donut({
  parts,
  center,
  centerSub,
}: {
  parts: { label: string; value: number; stroke: string; dot: string }[]
  center: string
  centerSub: string
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  const r = 15.915 // circunferencia = 100
  // Cada tramo arranca donde terminó el anterior (25 = arriba).
  const offsets = parts.map((_, i) => 25 - parts.slice(0, i).reduce((s, p) => s + (p.value / total) * 100, 0))
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 42 42" className="size-full">
          <circle cx="21" cy="21" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
          {parts.map((p, i) => {
            const len = (p.value / total) * 100
            return (
              <circle
                key={p.label}
                cx="21"
                cy="21"
                r={r}
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={offsets[i]}
                className={p.stroke}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-lg leading-none font-semibold tabular-nums">{center}</p>
            <p className="text-[10px] text-muted-foreground">{centerSub}</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className={cn('size-2.5 shrink-0 rounded-full', p.dot)} />
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="tabular-nums font-semibold">{p.value}</span>
            <span className="w-9 text-right tabular-nums text-muted-foreground">{pct(p.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Columnas por día. */
export function DayColumns({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-36 items-end gap-1.5">
      {data.map((d) => {
        const date = new Date(`${d.day}T12:00:00Z`)
        return (
          <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{d.count || ''}</span>
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{ height: `${d.count ? Math.max((d.count / max) * 100, 4) : 0}%` }}
                title={`${d.count} personas`}
              />
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground">
              {date.toLocaleDateString('es-CO', { weekday: 'narrow', timeZone: 'UTC' })}
              <br />
              {date.getUTCDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Barra apilada horizontal con leyenda. */
export function StackBar({ parts }: { parts: { label: string; value: number; className: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div className="space-y-2">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {parts.map((p) =>
          p.value ? <div key={p.label} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} /> : null
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 shrink-0 rounded-full', p.className)} />
            <span className="truncate">{p.label}</span>
            <span className="ml-auto tabular-nums font-semibold">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Lista con barras (motivos, botones…). */
export function BarList({ items }: { items: { label: string; value: number; hint?: string; className?: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium">{i.label}</span>
            <span className="tabular-nums font-semibold">{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', i.className ?? 'bg-primary')} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          {i.hint && <p className="text-[11px] text-muted-foreground">{i.hint}</p>}
        </li>
      ))}
    </ul>
  )
}
