import { getMonthMatrix } from '@/lib/calendar/utils'
import type { DayCell } from '@/lib/home/month-metrics'

const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function StatsOccupancyCalendar({
  monthKey,
  cells,
}: {
  monthKey: string
  cells: DayCell[]
}) {
  const weeks = getMonthMatrix(monthKey)
  const cellByKey = new Map(cells.map((c) => [c.dayKey, c]))
  const occupied = cells.filter((c) => c.state === 'full' || c.state === 'partial').length
  const free = cells.filter((c) => c.state === 'free').length

  return (
    <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <p className="font-display text-xs font-semibold text-muted-foreground">
        Días ocupados
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAY_LETTERS.map((l, i) => (
          <span key={i} className="text-center text-[10px] font-medium uppercase text-muted-foreground/60">
            {l}
          </span>
        ))}
        {weeks.flat().map((dayKey) => {
          const cell = cellByKey.get(dayKey)
          const inMonth = dayKey.startsWith(monthKey)
          const isOccupied = cell?.state === 'full' || cell?.state === 'partial'
          return (
            <span
              key={dayKey}
              className="aspect-square rounded-[4px]"
              style={{
                backgroundColor: !inMonth
                  ? 'transparent'
                  : isOccupied
                    ? 'var(--primary)'
                    : cell?.state === 'blocked'
                      ? 'color-mix(in oklab, var(--foreground) 6%, transparent)'
                      : 'color-mix(in oklab, var(--foreground) 10%, transparent)',
                opacity: !inMonth ? 0 : cell?.state === 'closed' ? 0.25 : 1,
              }}
              aria-hidden
            />
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-foreground/8 pt-3">
        <div>
          <p className="font-title font-bold text-lg tabular-nums text-primary">{occupied}</p>
          <p className="text-[12px] text-muted-foreground">Días ocupados</p>
        </div>
        <div className="text-right">
          <p className="font-title font-bold text-lg tabular-nums text-foreground">{free}</p>
          <p className="text-[12px] text-muted-foreground">Días libres</p>
        </div>
      </div>
    </div>
  )
}
