import { Columns } from 'crisbo-tattoo'

export const HorasPorDia = () => (
  <div className="max-w-sm">
    <Columns
      items={[
        { label: 'L', value: 4 },
        { label: 'M', value: 6.5 },
        { label: 'X', value: 5 },
        { label: 'J', value: 8 },
        { label: 'V', value: 9.5 },
        { label: 'S', value: 13.5 },
        { label: 'D', value: 0 },
      ]}
      height={72}
      format={(n) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })}
    />
  </div>
)

export const Edades = () => (
  <div className="max-w-xs">
    <Columns
      items={[
        { label: '18-24', value: 11 },
        { label: '25-34', value: 16 },
        { label: '35-44', value: 6 },
        { label: '45+', value: 3 },
      ]}
      height={64}
    />
  </div>
)
