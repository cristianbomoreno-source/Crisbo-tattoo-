import { AlertTriangle, TrendingUp, TrendingDown, Target, Info, DollarSign } from 'lucide-react'
import type { SmartRecommendation, SmartRecommendationType } from '@/lib/finance/alerts'

const typeIcons: Record<SmartRecommendationType, typeof AlertTriangle> = {
  alert: AlertTriangle,
  income: DollarSign,
  expense: TrendingDown,
  goal: Target,
  info: Info,
}

const typeColors: Record<SmartRecommendationType, string> = {
  alert: 'text-red-400 bg-red-500/10',
  income: 'text-emerald-400 bg-emerald-500/10',
  expense: 'text-amber-400 bg-amber-500/10',
  goal: 'text-primary bg-primary/10',
  info: 'text-blue-400 bg-blue-500/10',
}

const priorityBorders: Record<'high' | 'medium' | 'low', string> = {
  high: 'recommendation-card-high',
  medium: 'recommendation-card-medium',
  low: 'recommendation-card-low',
}

export function StatsRecommendations({
  recommendations,
}: {
  recommendations: SmartRecommendation[]
}) {
  if (recommendations.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Recomendaciones
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </section>
  )
}

function RecommendationCard({ recommendation }: { recommendation: SmartRecommendation }) {
  const Icon = typeIcons[recommendation.type]
  const iconClass = typeColors[recommendation.type]
  const borderClass = priorityBorders[recommendation.priority]

  return (
    <div className={`rounded-2xl bg-card p-4 ${borderClass}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${iconClass}`}>
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{recommendation.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{recommendation.description}</p>
          {recommendation.action && (
            <p className="mt-2 text-xs font-medium text-primary">{recommendation.action}</p>
          )}
        </div>
      </div>
      {recommendation.metric && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">{recommendation.metric.label}</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold tabular-nums">
              {recommendation.metric.value}
            </span>
            {recommendation.metric.target && (
              <>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs text-muted-foreground">{recommendation.metric.target}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
