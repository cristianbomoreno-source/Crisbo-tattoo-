import { cn } from '@/lib/utils'
import type { DecisionCard, Light } from '@/lib/social/decisions'

const LIGHT: Record<Light, { dot: string; ring: string; label: string }> = {
  good: { dot: 'bg-emerald-500', ring: 'ring-emerald-500/30', label: 'Bien' },
  warn: { dot: 'bg-amber-400', ring: 'ring-amber-400/40', label: 'Atención' },
  bad: { dot: 'bg-rose-500', ring: 'ring-rose-500/40', label: 'Actuar ya' },
  none: { dot: 'bg-zinc-400', ring: 'ring-foreground/10', label: 'Sin datos' },
}

/** Tarjetas semáforo: los rojos primero, para saber por dónde empezar. */
export function DecisionCards({ cards, goalEditor }: { cards: DecisionCard[]; goalEditor?: React.ReactNode }) {
  const order: Light[] = ['bad', 'warn', 'none', 'good']
  // La meta de ingresos siempre va primera: es la que manda.
  const sorted = [...cards].sort((a, b) =>
    a.key === 'revenue' ? -1 : b.key === 'revenue' ? 1 : order.indexOf(a.light) - order.indexOf(b.light)
  )
  return (
    <section className="space-y-2">
      <h2 className="font-display text-sm font-semibold text-muted-foreground">Qué hacer esta semana</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((c) => {
          const l = LIGHT[c.light]
          return (
            <article key={c.key} className={cn('flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1', l.ring)}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">{c.title}</h3>
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium">
                  <span className={cn('size-2.5 rounded-full', l.dot)} aria-hidden />
                  {l.label}
                </span>
              </div>
              <p className="font-display text-xl font-semibold tabular-nums">{c.value}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.detail}</p>
              <p className="mt-auto rounded-xl bg-muted/60 p-2.5 text-xs leading-relaxed">
                <span className="font-semibold">Qué hacer: </span>
                {c.action}
              </p>
              {c.key === 'revenue' && goalEditor}
            </article>
          )
        })}
      </div>
    </section>
  )
}
