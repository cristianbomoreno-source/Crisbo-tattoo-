import { StatsStylesRanking } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-md">
    <StatsStylesRanking
      rows={[
        { label: 'Fine line', count: 12, pct: 35 },
        { label: 'Realismo', count: 9, pct: 26 },
        { label: 'Blackwork', count: 6, pct: 18 },
        { label: 'Lettering', count: 4, pct: 12 },
        { label: 'Tradicional', count: 3, pct: 9 },
      ]}
    />
  </div>
)

export const SinDatos = () => (
  <div className="max-w-md">
    <StatsStylesRanking rows={[]} />
  </div>
)
