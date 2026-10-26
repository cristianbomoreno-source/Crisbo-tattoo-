import { ExpenseAlertsCard } from 'crisbo-tattoo'

export const Proximos = () => (
  <div className="max-w-md">
    <ExpenseAlertsCard
      alerts={[
        { expense: { id: '1', name: 'Arriendo local', amount: 2190000, due_day: 30 }, daysUntilDue: 0, dailyTargetToPayIt: 2190000, status: 'urgent', message: 'Vence hoy' },
        { expense: { id: '2', name: 'Internet del estudio', amount: 120000, due_day: 2 }, daysUntilDue: 3, dailyTargetToPayIt: 40000, status: 'warning', message: 'Vence en 3 días' },
        { expense: { id: '3', name: 'Tintas y agujas', amount: 380000, due_day: 15 }, daysUntilDue: 16, dailyTargetToPayIt: 23750, status: 'ok', message: '' },
      ]}
    />
  </div>
)
