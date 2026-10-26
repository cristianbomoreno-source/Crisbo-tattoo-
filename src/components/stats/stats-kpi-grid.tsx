import type { Icon } from '@phosphor-icons/react'
import { CalendarCheck, ClipboardText, Coins, Hourglass, TrendUp } from '@phosphor-icons/react/dist/ssr'
import { copShort } from '@/lib/projects/metrics'
import { deltaPct } from '@/lib/home/month-metrics'
import { DailyBars, DeltaChip, Ring } from '@/components/stats/charts'

function Tile({
  icon: IconCmp,
  label,
  value,
  delta,
  children,
}: {
  icon: Icon
  label: string
  value: string
  delta?: number | null
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-[1.25rem] bg-card p-3.5 sm:p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <IconCmp className="size-4 shrink-0" weight="duotone" aria-hidden />
        <span className="truncate text-[12px] font-medium">{label}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="font-title text-[1.4rem] font-bold leading-none tracking-tight tabular-nums">{value}</span>
        {delta !== undefined && <DeltaChip pct={delta} />}
      </div>
      {children && <div className="mt-auto pt-2.5">{children}</div>}
    </div>
  )
}

/** Barra fina de avance (p. ej. cobrado frente a lo proyectado). */
function Meter({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function StatsKpiGrid({
  quotedValue,
  prevQuotedValue,
  dailyQuoted,
  expectedIncome,
  confirmedIncome,
  pendingApprovalValue,
  pendingCount,
  scheduledSessions,
  prevScheduledSessions,
  dailySessions,
  upToIndex,
  occupancyPct,
  daysWithSessionOpen,
  workableDays,
  averageTicket,
  prevAverageTicket,
}: {
  quotedValue: number
  prevQuotedValue: number
  dailyQuoted: number[]
  expectedIncome: number
  confirmedIncome: number
  pendingApprovalValue: number
  pendingCount: number
  scheduledSessions: number
  prevScheduledSessions: number
  dailySessions: number[]
  /** Último día ya transcurrido (los siguientes se dibujan apagados). */
  upToIndex: number
  occupancyPct: number
  daysWithSessionOpen: number
  workableDays: number
  averageTicket: number
  prevAverageTicket: number
}) {
  const collectedPct = expectedIncome > 0 ? Math.round((confirmedIncome / expectedIncome) * 100) : 0

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      <Tile icon={ClipboardText} label="Cotizado" value={copShort(quotedValue)} delta={deltaPct(quotedValue, prevQuotedValue)}>
        <DailyBars values={dailyQuoted} upToIndex={upToIndex} />
      </Tile>

      <Tile
        icon={CalendarCheck}
        label="Sesiones"
        value={String(scheduledSessions)}
        delta={deltaPct(scheduledSessions, prevScheduledSessions)}
      >
        <DailyBars values={dailySessions} upToIndex={upToIndex} />
      </Tile>

      <Tile icon={TrendUp} label="Proyección" value={copShort(expectedIncome)}>
        <Meter pct={collectedPct} />
        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{collectedPct}% cobrado</p>
      </Tile>

      <Tile icon={Hourglass} label="Por aprobar" value={copShort(pendingApprovalValue)}>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {pendingCount} {pendingCount === 1 ? 'cotización' : 'cotizaciones'}
        </p>
      </Tile>

      <div className="flex min-w-0 items-center gap-3 rounded-[1.25rem] bg-card p-3.5 sm:p-4">
        <Ring pct={occupancyPct} size={58} thickness={11} label={`Ocupación ${occupancyPct}%`}>
          <span className="text-[13px] font-bold tabular-nums">{occupancyPct}%</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">Ocupación</p>
          <p className="mt-0.5 font-title text-base font-bold tabular-nums leading-tight">
            {daysWithSessionOpen}
            <span className="text-muted-foreground">/{workableDays}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">días</p>
        </div>
      </div>

      <Tile icon={Coins} label="Ticket medio" value={copShort(averageTicket)} delta={deltaPct(averageTicket, prevAverageTicket)} />
    </section>
  )
}
