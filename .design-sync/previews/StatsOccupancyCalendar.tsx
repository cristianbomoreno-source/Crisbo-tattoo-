import { StatsOccupancyCalendar } from 'crisbo-tattoo'

const pattern = ['full', 'partial', 'free', 'full', 'partial', 'full'] as const
const cells = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  const wd = new Date(Date.UTC(2026, 9, day)).getUTCDay()
  const state = wd === 0 ? 'closed' : day === 13 ? 'blocked' : pattern[day % pattern.length]
  return { dayKey: `2026-10-${String(day).padStart(2, '0')}`, day, state, remainingMinutes: 0 }
})

export const Octubre = () => (
  <div className="max-w-xs">
    <StatsOccupancyCalendar monthKey="2026-10" cells={cells as never} />
  </div>
)
