import type { Icon } from '@phosphor-icons/react'
import { Coins, Lightbulb, Target, TrendDown, Warning } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'
import type { SmartRecommendation, SmartRecommendationType } from '@/lib/finance/alerts'

const typeIcons: Record<SmartRecommendationType, Icon> = {
  alert: Warning,
  income: Coins,
  expense: TrendDown,
  goal: Target,
  info: Lightbulb,
}

const typeColors: Record<SmartRecommendationType, string> = {
  alert: 'text-destructive bg-destructive/12',
  income: 'text-income bg-income/12',
  expense: 'text-warning bg-warning/12',
  goal: 'text-primary bg-primary/12',
  info: 'text-foreground/80 bg-muted',
}

/** Consejos del mes en filas cortas: título y la cifra que lo respalda. */
export function StatsRecommendations({ recommendations }: { recommendations: SmartRecommendation[] }) {
  if (recommendations.length === 0) return null

  return (
    <section className="rounded-[1.5rem] bg-card p-2">
      <h2 className="px-2.5 pb-1 pt-2 text-sm font-semibold">Para mirar</h2>
      <ul className="divide-y divide-border/60">
        {recommendations.map((rec) => {
          const IconCmp = typeIcons[rec.type]
          return (
            <li key={rec.id} className="flex items-center gap-3 px-2.5 py-2.5">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', typeColors[rec.type])}>
                <IconCmp className="size-[18px]" weight="duotone" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug">{rec.title}</p>
                {rec.action && <p className="truncate text-[12px] text-muted-foreground">{rec.action}</p>}
              </div>
              {rec.metric && (
                <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums">
                  {rec.metric.value}
                  {rec.metric.target && <span className="block text-[11px] font-normal text-muted-foreground">de {rec.metric.target}</span>}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
