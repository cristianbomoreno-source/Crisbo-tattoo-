import { StatsHoursCard } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-md">
    <StatsHoursCard
      hours={46.5}
      avgPerSession={2.6}
      byWeekday={[
        { label: 'L', value: 4 },
        { label: 'M', value: 6.5 },
        { label: 'X', value: 5 },
        { label: 'J', value: 8 },
        { label: 'V', value: 9.5 },
        { label: 'S', value: 13.5 },
        { label: 'D', value: 0 },
      ]}
    />
  </div>
)
