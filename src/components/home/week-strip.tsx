'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ymOfKey } from '@/lib/calendar/utils'

const WEEKDAYS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SÁ']

/**
 * Tira de días del Inicio: se desliza por todo el mes (swipe). Los días con
 * al menos una cita O bloqueados se pintan con el óvalo completo relleno
 * (no un punto chico) para que se distingan de un vistazo. Tocar un día abre
 * el popup de calendario (lo controla el padre) en vez de navegar de página.
 */
export function WeekStrip({
  days,
  today,
  blockedDays = [],
  onSelectDay,
}: {
  days: { key: string; count: number }[]
  today: string
  blockedDays?: string[]
  onSelectDay: (key: string) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const blockedSet = new Set(blockedDays)

  useEffect(() => {
    // v3 del centrado — las dos versiones anteriores fallaron en producción:
    // 1) `scrollIntoView` corría toda la página (bug real, ya reportado).
    // 2) `el.offsetLeft` medido justo después del mount podía leer un
    //    layout todavía no asentado (fuentes/reflow) y salir mal.
    // Esta vez no se mide NADA del DOM de los hijos: el ancho de cada
    // pastilla es fijo por Tailwind (w-11=44px normal, w-14=56px "hoy"),
    // así que la posición de "hoy" se calcula por aritmética pura a partir
    // de su índice en `days` — no puede desincronizarse con el layout real.
    const scroller = scrollerRef.current
    if (!scroller) return
    const todayIndex = days.findIndex((d) => d.key === today)
    if (todayIndex < 0) return
    const REGULAR_STEP = 44 + 6 // w-11 (44px) + gap-1.5 (6px) de cada pastilla normal antes de "hoy"
    const TODAY_WIDTH = 56 // w-14
    const leftEdge = todayIndex * REGULAR_STEP
    const raf = requestAnimationFrame(() => {
      const target = leftEdge - scroller.clientWidth / 2 + TODAY_WIDTH / 2
      scroller.scrollLeft = Math.max(0, target)
    })
    return () => cancelAnimationFrame(raf)
  }, [days, today])

  return (
    <div
      ref={scrollerRef}
      className="relative -mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        // Difuminado en ambos bordes: sin esto, cuando los días llenan el
        // ancho exacto de la tarjeta (como el día de hoy centrado), no hay
        // ninguna pista de que se puede seguir deslizando y parece una fila
        // fija/completa. El fade dice "hay más para cada lado" de un vistazo.
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
        maskImage:
          'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
        // Momentum de scroll de iOS — sin esto, algunas PWA instaladas en
        // iOS pueden ignorar el swipe horizontal dentro de un contenedor
        // anidado cuando el body ya tiene `overflow-x: hidden`.
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {days.map((d) => {
        const { year, month, day } = ymOfKey(d.key)
        const weekdayIdx = new Date(Date.UTC(year, month, day)).getUTCDay()
        const busy = d.count > 0
        const blocked = blockedSet.has(d.key)
        const marked = busy || blocked
        const isToday = d.key === today

        if (isToday) {
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDay(d.key)}
              aria-label={`Hoy, ${WEEKDAYS[weekdayIdx]} ${day}: ${marked ? 'con cita o bloqueado' : 'libre'}`}
              className="flex w-14 shrink-0 snap-center flex-col items-center gap-1 rounded-2xl bg-primary py-2.5 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                {WEEKDAYS[weekdayIdx]}
              </span>
              <span className="text-xl font-semibold tabular-nums leading-none">{day}</span>
            </button>
          )
        }

        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onSelectDay(d.key)}
            aria-label={`${WEEKDAYS[weekdayIdx]} ${day}: ${marked ? 'con cita o bloqueado' : 'libre'}`}
            className={cn(
              'flex w-11 shrink-0 snap-center flex-col items-center gap-1 rounded-xl py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              blocked
                ? 'bg-muted-foreground/15 text-muted-foreground'
                : marked
                  ? 'bg-primary/20 text-foreground hover:bg-primary/25'
                  : 'bg-card text-foreground hover:bg-accent'
            )}
            style={
              blocked
                ? {
                    backgroundImage:
                      'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 3px, transparent 3px, transparent 7px)',
                  }
                : undefined
            }
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {WEEKDAYS[weekdayIdx]}
            </span>
            <span className="text-base font-medium tabular-nums leading-none">{day}</span>
          </button>
        )
      })}
    </div>
  )
}
