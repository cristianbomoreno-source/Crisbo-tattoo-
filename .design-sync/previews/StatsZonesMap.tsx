import { StatsZonesMap } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-sm">
    <StatsZonesMap
      rows={[
        { label: 'Antebrazo', count: 9, pct: 32 },
        { label: 'Brazo', count: 6, pct: 21 },
        { label: 'Espalda', count: 5, pct: 18 },
        { label: 'Pierna', count: 4, pct: 14 },
        { label: 'Costillas', count: 2, pct: 8 },
        { label: 'Cuello', count: 2, pct: 7 },
      ]}
    />
  </div>
)
