import { StatusBadge } from 'crisbo-tattoo'

export const Proyecto = () => (
  <div className="flex flex-wrap gap-2">
    {['quote', 'design', 'approval', 'scheduled', 'completed', 'cancelled'].map((s) => (
      <StatusBadge key={s} status={s} />
    ))}
  </div>
)

export const Cotizacion = () => (
  <div className="flex flex-wrap gap-2">
    {['new', 'reviewed', 'quoted', 'approved', 'rejected', 'rescheduled'].map((s) => (
      <StatusBadge key={s} status={s} />
    ))}
  </div>
)
