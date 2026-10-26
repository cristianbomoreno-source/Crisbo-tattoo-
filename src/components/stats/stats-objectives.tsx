import Link from 'next/link'
import { Target } from '@phosphor-icons/react/dist/ssr'
import { copShort } from '@/lib/projects/metrics'
import { Ring } from '@/components/stats/charts'

type Goal = { label: string; current: number; goal: number | null; format: (n: number) => string }

/** Metas del mes como tres anillos: cotizar, aprobar y agendar. */
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
    { label: 'Cotizar', current: quotedValue, goal: quotedGoal, format: copShort },
    { label: 'Aprobar', current: approvedCount, goal: approvedGoal, format: String },
    { label: 'Agendar', current: scheduledSessions, goal: sessionsGoal, format: String },
  ].filter((g) => g.goal !== null && g.goal > 0)

  if (goals.length === 0) {
    return (
      <Link
        href="/dashboard/settings/metas"
        className="flex min-h-14 items-center gap-3 rounded-[1.5rem] bg-card px-4 py-3 transition-transform duration-150 active:scale-[0.98]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
          <Target className="size-[18px]" weight="duotone" aria-hidden />
        </span>
        <span className="flex-1 text-[14px] font-medium">Ponte metas para el mes</span>
        <span className="text-[13px] font-semibold text-primary">Definir</span>
      </Link>
    )
  }

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Metas del mes</h2>
        <Link href="/dashboard/settings/metas" className="text-[12px] font-medium text-muted-foreground hover:text-foreground">
          Editar
        </Link>
      </div>
      <div className="mt-4 flex justify-around gap-2">
        {goals.map((g) => {
          const pct = Math.round((g.current / (g.goal ?? 1)) * 100)
          return (
            <div key={g.label} className="flex flex-col items-center gap-2">
              <Ring
                pct={pct}
                size={76}
                thickness={10}
                color={pct >= 100 ? 'var(--income)' : 'var(--primary)'}
                label={`${g.label}: ${pct}%`}
              >
                <span className="text-[15px] font-bold tabular-nums">{pct}%</span>
              </Ring>
              <div className="text-center leading-tight">
                <p className="text-[13px] font-medium">{g.label}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {g.format(g.current)} / {g.format(g.goal ?? 0)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
