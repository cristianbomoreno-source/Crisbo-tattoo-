import { StatsAudienceCard } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-md">
    <StatsAudienceCard
      gender={{ hombres: 14, mujeres: 22, total: 36, pctHombres: 39, pctMujeres: 61 }}
      age={{
        average: 27,
        brackets: [
          { label: '18-24', count: 11, pct: 31 },
          { label: '25-34', count: 16, pct: 44 },
          { label: '35-44', count: 6, pct: 17 },
          { label: '45+', count: 3, pct: 8 },
        ],
      }}
    />
  </div>
)
