'use client'

import { cn } from '@/lib/utils'
import { ymOfKey } from '@/lib/calendar/utils'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Mes completo en la tarjeta "Calendario" del Inicio, al estilo del
 * Calendario de iPhone: el mes en grande arriba, números sueltos (sin
 * cuadros), hoy en un círculo dorado y un punto por cita debajo de cada día
 * (hasta 3). Puntos verdes = citas finalizadas o pagadas; días bloqueados en
 * gris tenue. Tocar un día abre el popup en vista Día (o agendar, si está libre).
 */
export function MonthGrid({
  days,
  today,
  blockedDays = [],
  onSelectDay,
  action,
}: {
  days: { key: string; count: number; paid?: boolean; green?: boolean }[]
  today: string
  blockedDays?: string[]
  onSelectDay: (key: string) => void
  /** Botón a la derecha del nombre del mes. */
  action?: React.ReactNode
}) {
  if (days.length === 0) return null
  const blockedSet = new Set(blockedDays)
  const { year, month } = ymOfKey(days[0]!.key)
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleDateString('es-CO', { month: 'long', timeZone: 'UTC' })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-title text-[1.625rem] leading-tight font-bold tracking-tight">
          <span className="text-primary capitalize">{monthName}</span> <span className="text-muted-foreground">{year}</span>
        </h2>
        {action}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="pb-1 text-[12px] font-semibold text-muted-foreground">
            {w}
          </span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`pad-${i}`} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const { day } = ymOfKey(d.key)
          const isToday = d.key === today
          const blocked = blockedSet.has(d.key)
          const busy = d.count > 0 && !blocked
          const paid = busy && !!d.paid
          const green = busy && (!!d.green || paid)
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDay(d.key)}
              aria-label={`Día ${day}${isToday ? ' (hoy)' : ''}: ${
                blocked ? 'bloqueado' : paid ? `${d.count} cita(s) pagadas` : busy ? `${d.count} cita(s)` : 'libre'
              }`}
              className="group flex h-12 flex-col items-center justify-start gap-1 pt-0.5 focus-visible:outline-none"
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full text-[1.0625rem] tabular-nums transition-[background-color,transform] duration-150 ease-out group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  isToday
                    ? 'bg-primary font-bold text-primary-foreground'
                    : blocked
                      ? 'text-muted-foreground/45 line-through decoration-1'
                      : busy
                        ? 'font-semibold text-foreground group-hover:bg-secondary'
                        : 'text-foreground/90 group-hover:bg-secondary',
                )}
              >
                {day}
              </span>
              <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
                {busy &&
                  Array.from({ length: Math.min(d.count, 3) }).map((_, i) => (
                    <span key={i} className={cn('size-1.5 rounded-full', green ? 'bg-income' : 'bg-primary')} />
                  ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
