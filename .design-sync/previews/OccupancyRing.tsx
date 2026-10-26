import { OccupancyRing } from 'crisbo-tattoo'

export const ConEtiqueta = () => <OccupancyRing pct={64} label="Ocupación" sublabel="14 / 22 días" />

export const Compacto = () => (
  <div className="flex items-center gap-4">
    <OccupancyRing pct={35} compact />
    <OccupancyRing pct={90} compact />
  </div>
)
