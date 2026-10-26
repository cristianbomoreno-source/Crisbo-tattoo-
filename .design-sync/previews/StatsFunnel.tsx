import { StatsFunnel } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-md">
    <StatsFunnel
      conversionPct={34}
      stages={[
        { label: 'Solicitudes', count: 41 },
        { label: 'Cotizaciones enviadas', count: 33 },
        { label: 'Aprobadas', count: 14 },
        { label: 'Sesiones agendadas', count: 18 },
        { label: 'Sesiones finalizadas', count: 11 },
      ]}
    />
  </div>
)
