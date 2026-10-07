import { Briefcase, CalendarCheck } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { deltaPct } from '@/lib/home/month-metrics'
import { OccupancyRing } from '@/components/home/occupancy-ring'

function DeltaLabel({ cur, prev }: { cur: number; prev: number }) {
  const pct = deltaPct(cur, prev)
  if (pct === null) return null
  const color = pct > 0 ? 'text-[color:var(--success)]' : pct < 0 ? 'text-destructive' : 'text-muted-foreground'
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : ''
  return (
    <p className={`mt-1 text-[11px] tabular-nums ${color}`}>
      {arrow} {Math.abs(pct)}%
    </p>
  )
}

export function StatsSummaryStrip({
  quotedValue,
  prevQuotedValue,
  approvedCount,
  prevApprovedCount,
  scheduledSessions,
  prevScheduledSessions,
  occupancyPct,
  prevOccupancyPct,
  daysWithSessionOpen,
  workableDays,
}: {
  quotedValue: number
  prevQuotedValue: number
  approvedCount: number
  prevApprovedCount: number
  scheduledSessions: number
  prevScheduledSessions: number
  occupancyPct: number
  prevOccupancyPct: number
  daysWithSessionOpen: number
  workableDays: number
}) {
  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-6">
        <div>
          <p className="font-title text-[clamp(1.35rem,5vw,2rem)] tabular-nums text-primary">{cop(quotedValue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Valor cotizado</p>
          <DeltaLabel cur={quotedValue} prev={prevQuotedValue} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="font-title text-[clamp(1.35rem,5vw,2rem)] tabular-nums text-white">{approvedCount}</p>
            <Briefcase className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Proyectos aprobados</p>
          <DeltaLabel cur={approvedCount} prev={prevApprovedCount} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="font-title text-[clamp(1.35rem,5vw,2rem)] tabular-nums text-white">{scheduledSessions}</p>
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Sesiones agendadas</p>
          <DeltaLabel cur={scheduledSessions} prev={prevScheduledSessions} />
        </div>

        <div className="flex items-center gap-3">
          <OccupancyRing pct={occupancyPct} compact />
          <div>
            <p className="font-title text-[clamp(1.1rem,4vw,1.6rem)] tabular-nums text-white">
              {daysWithSessionOpen} / {workableDays}
            </p>
            <p className="text-xs text-muted-foreground">Ocupación del mes</p>
            <DeltaLabel cur={occupancyPct} prev={prevOccupancyPct} />
          </div>
        </div>
      </div>
    </section>
  )
}
