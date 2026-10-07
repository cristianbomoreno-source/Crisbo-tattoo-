import type { ComponentType } from 'react'
import { Clock, CalendarCheck, UserPlus, Receipt, Gauge } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'

type Stat = { icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string }

export function FinanceProductionGrid({
  hours,
  sessionCount,
  newClients,
  avgTicket,
  valuePerHour,
}: {
  hours: number
  sessionCount: number
  newClients: number
  avgTicket: number
  valuePerHour: number
}) {
  const stats: Stat[] = [
    { icon: Clock, label: 'Horas tatuadas', value: `${hours.toFixed(1)} h` },
    { icon: CalendarCheck, label: 'Sesiones realizadas', value: String(sessionCount) },
    { icon: UserPlus, label: 'Clientes nuevos', value: String(newClients) },
    { icon: Receipt, label: 'Ticket promedio', value: cop(avgTicket) },
    { icon: Gauge, label: 'Valor por hora', value: hours > 0 ? cop(valuePerHour) : '—' },
  ]

  return (
    <div>
      <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Producción del mes
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-card p-4">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4.5" strokeWidth={1.8} />
            </span>
            <p className="mt-3 font-title text-lg leading-none tabular-nums text-white">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
