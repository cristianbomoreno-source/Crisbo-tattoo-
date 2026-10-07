import Link from 'next/link'
import { Target, ChevronRight } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'

type Goal = {
  label: string
  current: number
  goal: number | null
  format: (n: number) => string
}

function GoalBar({ goal }: { goal: Goal }) {
  if (goal.goal === null || goal.goal <= 0) return null
  const pct = Math.min(100, Math.round((goal.current / goal.goal) * 100))
  return (
    <div>
      <p className="text-xs text-white/80">
        {goal.label} {goal.format(goal.goal)}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">{goal.format(goal.current)}</p>
    </div>
  )
}

export function StatsObjectives({
  quotedValue,
  quotedGoal,
  approvedCount,
  approvedGoal,
  scheduledSessions,
  sessionsGoal,
}: {
  quotedValue: number
  quotedGoal: number | null
  approvedCount: number
  approvedGoal: number | null
  scheduledSessions: number
  sessionsGoal: number | null
}) {
  const goals: Goal[] = [
    { label: 'Cotizar', current: quotedValue, goal: quotedGoal, format: cop },
    { label: 'Aprobar', current: approvedCount, goal: approvedGoal, format: (n) => `${n} proyectos` },
    { label: 'Agendar', current: scheduledSessions, goal: sessionsGoal, format: (n) => `${n} sesiones` },
  ]
  const anyGoal = goals.some((g) => g.goal !== null && g.goal > 0)

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10">
          <Target className="size-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-title text-lg text-white">Objetivo del mes</p>
          {anyGoal ? (
            <p className="text-xs text-muted-foreground">Sigue así, vas en buen camino para alcanzar tu meta.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aún no definiste metas mensuales.{' '}
              <Link href="/dashboard/settings/metas" className="text-primary underline-offset-2 hover:underline">
                Definir metas
              </Link>
            </p>
          )}
        </div>
      </div>

      {anyGoal && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {goals.map((g) => (
              <GoalBar key={g.label} goal={g} />
            ))}
          </div>
          <Link
            href="/dashboard/settings/metas"
            className="mt-5 inline-flex items-center gap-1 font-heading text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:text-white"
          >
            Ver objetivos completos <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </>
      )}
    </section>
  )
}
