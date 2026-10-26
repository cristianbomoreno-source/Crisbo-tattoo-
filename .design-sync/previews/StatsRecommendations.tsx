import { StatsRecommendations } from 'crisbo-tattoo'

export const Octubre = () => (
  <div className="max-w-md">
    <StatsRecommendations
      recommendations={[
        { id: 'a', type: 'alert', priority: 'high', title: 'Tienes $1,8M por aprobar', description: '', action: 'Escríbeles a los 6 clientes', metric: { label: '', value: '6' } },
        { id: 'b', type: 'goal', priority: 'medium', title: 'Vas al 52% de la meta', description: '', metric: { label: '', value: '$2,6M', target: '$5M' } },
        { id: 'c', type: 'expense', priority: 'medium', title: 'El arriendo del local vence en 4 días', description: '', action: 'Aparta $547.500 por día', metric: { label: '', value: '$2,19M' } },
        { id: 'd', type: 'income', priority: 'low', title: 'Por cobrar $1,2M de saldos', description: '', metric: { label: '', value: '$1,2M' } },
      ]}
    />
  </div>
)
