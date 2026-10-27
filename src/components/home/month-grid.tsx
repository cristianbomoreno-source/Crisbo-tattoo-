'use client'

import { cn } from '@/lib/utils'
import { ymOfKey } from '@/lib/calendar/utils'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Mes completo en la tarjeta "Calendario" del Inicio, al estilo del
 * Calendario de iPhone: el mes en grande arriba y números sueltos; los días
 * con cita se rellenan como un cuadrito de las tarjetas de color (dorado, o
 * verde si ya están finalizadas o pagadas) con el número de citas si hay más
 * de una; hoy va en un círculo dorado; días bloqueados en gris tenue. Tocar un día abre el popup en vista Día (o agendar, si está libre).
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
              className="group grid h-12 place-items-center focus-visible:outline-none"
            >
              <span
                className={cn(
                  'relative grid size-10 place-items-center text-[1.0625rem] tabular-nums transition-[background-color,transform] duration-150 ease-out group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  busy
                    ? cn(
                        'rounded-[0.85rem] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]',
                        green ? 'tile-green' : 'tile-gold',
                        isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                      )
                    : isToday
                      ? 'rounded-full bg-primary font-bold text-primary-foreground'
                      : blocked
                        ? 'rounded-full text-muted-foreground/45 line-through decoration-1'
                        : 'rounded-full text-foreground/90 group-hover:bg-secondary',
                )}
              >
                {day}
                {busy && d.count > 1 && (
                  <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-white text-[10px] font-bold text-black">
                    {d.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
