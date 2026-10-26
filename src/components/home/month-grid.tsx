'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ymOfKey } from '@/lib/calendar/utils'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Mes completo en la tarjeta "Calendario" del Inicio (reemplaza la tira de
 * días que se deslizaba): todo el mes visible de un vistazo. Días con cita
 * resaltados, bloqueados rayados, y en verde con ✓ los días cuyas citas ya
 * están pagadas por completo. Tocar un día abre el popup en vista Día.
 */
export function MonthGrid({
  days,
  today,
  blockedDays = [],
  onSelectDay,
}: {
  days: { key: string; count: number; paid?: boolean; green?: boolean }[]
  today: string
  blockedDays?: string[]
  onSelectDay: (key: string) => void
}) {
  if (days.length === 0) return null
  const blockedSet = new Set(blockedDays)
  const { year, month } = ymOfKey(days[0]!.key)
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-medium capitalize text-muted-foreground">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="pb-0.5 text-[11px] font-medium text-muted-foreground">
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
          const busy = d.count > 0
          const paid = busy && !blocked && !!d.paid
          // Verde: finalizadas o pagadas; el ✓ solo si están pagadas.
          const green = busy && !blocked && (!!d.green || paid)
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDay(d.key)}
              aria-label={`Día ${day}${isToday ? ' (hoy)' : ''}: ${
                blocked ? 'bloqueado' : paid ? `${d.count} cita(s) pagadas` : busy ? `${d.count} cita(s)` : 'libre'
              }`}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isToday
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : blocked
                    ? 'bg-muted-foreground/15 text-muted-foreground'
                    : green
                      ? 'bg-income/25 text-foreground'
                      : busy
                        ? 'bg-primary/20 text-foreground hover:bg-primary/25'
                        : 'text-foreground hover:bg-accent'
              )}
              style={
                blocked && !isToday
                  ? {
                      backgroundImage:
                        'repeating-linear-gradient(135deg, color-mix(in oklab, var(--foreground) 8%, transparent) 0px, color-mix(in oklab, var(--foreground) 8%, transparent) 3px, transparent 3px, transparent 7px)',
                    }
                  : undefined
              }
            >
              {day}
              {paid && (
                <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-income text-income-foreground">
                  <Check className="size-2.5" strokeWidth={3.5} aria-hidden="true" />
                </span>
              )}
              {busy && !green && !blocked && !isToday && d.count > 1 && (
                <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-primary">
                  {d.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
