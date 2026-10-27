'use client'

import { useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import {
  getMonthKeys,
  getWeekKeys,
  ymOfKey,
  shiftMonth,
  shiftDay,
  formatTime,
  minutesOfDay,
  labelHour,
} from '@/lib/calendar/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { SessionWithProject } from '@/queries/sessions'
import { isProjectFullyPaid, isSessionGreen } from '@/lib/sessions/paid'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const HOUR_PX = 56
export type CalendarView = 'day' | 'week' | 'month'

/**
 * EL calendario de Crisbo Tattoo — Día / Semana / Mes. Un solo componente, usado tal
 * cual tanto en el popup de Inicio (`home-calendar-dialog.tsx`) como en la
 * página completa (`calendar-view.tsx`); antes eran dos implementaciones
 * visualmente distintas (la página tenía su propio grid de mes con puntos
 * estilo Apple Calendar y solo alternaba Mes/Día). Ya no.
 *
 * Es "tonto"/controlado a propósito: recibe `byDay`/`blockedSet` ya
 * calculados y `view`/`monthKey`/`selectedDay` con sus setters — quien lo
 * usa decide CÓMO llegan los datos (fetch de cliente en el popup,
 * `router.push` + refetch de servidor en la página) sin que este
 * componente lo sepa.
 */
export function CalendarNav({
  view,
  onViewChange,
  monthKey,
  onMonthKeyChange,
  selectedDay,
  onSelectedDayChange,
  byDay,
  blockedSet,
  today,
  loading,
  onSelectSession,
  onLongPressSession,
  onSelectSlot,
  onToggleBlockDay,
  blockPending,
  onMoveSession,
}: {
  view: CalendarView
  onViewChange: (v: CalendarView) => void
  monthKey: string
  onMonthKeyChange: (updater: (m: string) => string) => void
  selectedDay: string
  onSelectedDayChange: (updater: (d: string) => string) => void
  byDay: Record<string, SessionWithProject[]>
  blockedSet: Set<string>
  today: string
  loading?: boolean
  onSelectSession: (s: SessionWithProject) => void
  /** Mantener presionada una cita en la vista Día sin arrastrarla: editarla o eliminarla. */
  onLongPressSession?: (s: SessionWithProject) => void
  onSelectSlot: (dayKey: string, time: string) => void
  /** Si se pasa, el día muestra el control de "Bloquear día" / "Día bloqueado". */
  onToggleBlockDay?: (dayKey: string, blocked: boolean) => void | Promise<void>
  blockPending?: boolean
  /** Si se pasa, habilita arrastrar una cita (tras mantenerla presionada) a
   * otra hora del mismo día, o soltarla sobre uno de los días de la franja
   * mini de arriba para moverla de día (misma hora). Sin este prop, mantener
   * presionado se comporta como antes (solo abre `onLongPressSession`). */
  onMoveSession?: (session: SessionWithProject, newDayKey: string, newTime: string) => void
}) {
  const touchStartX = useRef<number | null>(null)
  const [confirmingBlock, setConfirmingBlock] = useState(false)

  const monthDays = getMonthKeys(`${monthKey}-01`)
  const weekDays = getWeekKeys(selectedDay)
  const { year, month } = ymOfKey(`${monthKey}-01`)
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const daySessions = (byDay[selectedDay] ?? []).sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )
  const dayLabelText = new Date(`${selectedDay}T00:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  const dayBlocked = blockedSet.has(selectedDay)

  function DayCell({ dKey }: { dKey: string }) {
    const { day } = ymOfKey(dKey)
    const busy = (byDay[dKey]?.length ?? 0) > 0
    const blocked = blockedSet.has(dKey)
    const isToday = dKey === today
    const selected = dKey === selectedDay
    const paid = busy && !blocked && allSessionsPaid(byDay[dKey])
    const green = busy && !blocked && allSessionsGreen(byDay[dKey])
    const count = byDay[dKey]?.length ?? 0
    return (
      <button
        type="button"
        onClick={() => {
          onSelectedDayChange(() => dKey)
          onViewChange('day')
        }}
        title={blocked ? 'Día bloqueado' : paid ? 'Citas pagadas' : green ? 'Citas finalizadas' : undefined}
        className="group flex h-12 flex-col items-center justify-start gap-1 pt-0.5 focus-visible:outline-none"
      >
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full text-[1.0625rem] tabular-nums transition-[background-color,transform] duration-150 ease-out group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-ring',
            selected
              ? 'bg-primary font-bold text-primary-foreground'
              : isToday
                ? 'font-bold text-primary group-hover:bg-secondary'
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
            !blocked &&
            Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <span key={i} className={cn('size-1.5 rounded-full', green ? 'bg-income' : 'bg-primary')} />
            ))}
        </span>
        {blocked && <span className="sr-only"> (día bloqueado)</span>}
        {paid && <span className="sr-only"> (pagado)</span>}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-full bg-foreground/[0.07] p-1">
        {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={cn(
              'flex-1 rounded-full py-2 text-[15px] font-semibold transition-[background-color,color] duration-150 ease-out',
              view === v ? 'bg-foreground/15 text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {view === 'month' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-title text-[1.5rem] leading-tight font-bold tracking-tight text-primary capitalize">{monthLabel}</span>
            <span className="flex gap-2">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => onMonthKeyChange((m) => shiftMonth(m, -1))}
                className="grid size-10 place-items-center rounded-full bg-foreground/[0.07] transition-transform duration-150 ease-out active:scale-90"
              >
                <ChevronLeft className="size-5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => onMonthKeyChange((m) => shiftMonth(m, 1))}
                className="grid size-10 place-items-center rounded-full bg-foreground/[0.07] transition-transform duration-150 ease-out active:scale-90"
              >
                <ChevronRight className="size-5" strokeWidth={2.4} />
              </button>
            </span>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="pb-1 text-[12px] font-semibold text-muted-foreground">
                {w}
              </span>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {monthDays.map((k) => (
              <DayCell key={k} dKey={k} />
            ))}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="space-y-2">
          {weekDays.map((k) => {
            const items = (byDay[k] ?? []).sort(
              (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            )
            const blocked = blockedSet.has(k)
            const { day } = ymOfKey(k)
            const label = new Date(`${k}T00:00:00Z`).toLocaleDateString('es-CO', {
              weekday: 'short',
              timeZone: 'UTC',
            })
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onSelectedDayChange(() => k)
                  onViewChange('day')
                }}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-[1.25rem] p-3 text-left transition-transform duration-150 ease-out active:scale-[0.98]',
                  k === today ? 'bg-primary/12' : blocked ? 'bg-foreground/[0.04]' : 'bg-foreground/[0.07]'
                )}
                style={
                  blocked && k !== today
                    ? {
                        backgroundImage:
                          'repeating-linear-gradient(135deg, color-mix(in oklab, var(--foreground) 5%, transparent) 0px, color-mix(in oklab, var(--foreground) 5%, transparent) 3px, transparent 3px, transparent 7px)',
                      }
                    : undefined
                }
              >
                <div className="w-11 shrink-0 text-center">
                  <p className={cn('text-[12px] font-semibold uppercase', k === today ? 'text-primary' : 'text-muted-foreground')}>{label}</p>
                  <p className="font-title text-[1.5rem] leading-none font-bold tabular-nums">{day}</p>
                </div>
                <div className="min-w-0 flex-1">
                  {blocked ? (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3" strokeWidth={1.8} />
                      Bloqueado
                    </p>
                  ) : items.length === 0 ? (
                    <p className="text-[15px] text-muted-foreground">Sin citas</p>
                  ) : (
                    <p className="line-clamp-2 text-[15px] text-foreground/85">
                      {items
                        .map((s) => `${formatTime(s.scheduled_at)} ${s.projects?.clients?.name ?? ''}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                {items.length > 0 &&
                  (allSessionsGreen(items) ? (
                    <span className="flex shrink-0 items-center gap-1">
                      {allSessionsPaid(items) && <PaidBadge />}
                      <span className="rounded-full bg-income/20 px-2 py-0.5 text-[12px] font-semibold">
                        {items.length}
                      </span>
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-semibold text-primary">
                      {items.length}
                    </span>
                  ))}
              </button>
            )
          })}
        </div>
      )}

      {view === 'day' && (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {weekDays.map((k) => {
              const { day } = ymOfKey(k)
              const weekdayLabel = new Date(`${k}T00:00:00Z`).toLocaleDateString('es-CO', {
                weekday: 'narrow',
                timeZone: 'UTC',
              })
              const busy = (byDay[k]?.length ?? 0) > 0
              const dayBlockedMini = blockedSet.has(k)
              const selected = k === selectedDay
              return (
                <button
                  key={k}
                  type="button"
                  data-day-picker={k}
                  onClick={() => onSelectedDayChange(() => k)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-[15px] font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-95 data-[drop-hover=true]:ring-2 data-[drop-hover=true]:ring-primary',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : dayBlockedMini
                        ? 'text-muted-foreground/50'
                        : busy
                          ? 'bg-primary/15 text-foreground'
                          : 'text-foreground hover:bg-foreground/[0.07]'
                  )}
                  style={
                    dayBlockedMini && !selected
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(135deg, color-mix(in oklab, var(--foreground) 8%, transparent) 0px, color-mix(in oklab, var(--foreground) 8%, transparent) 3px, transparent 3px, transparent 7px)',
                        }
                      : undefined
                  }
                >
                  <span className="text-[11px] uppercase opacity-70">{weekdayLabel}</span>
                  <span className="tabular-nums">{day}</span>
                </button>
              )
            })}
          </div>

          <div
            className="space-y-3 pt-1"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]!.clientX
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const delta = e.changedTouches[0]!.clientX - touchStartX.current
              touchStartX.current = null
              if (Math.abs(delta) < 60) return
              onSelectedDayChange((d) => shiftDay(d, delta < 0 ? 1 : -1))
            }}
          >
            <p className="font-title text-[1.25rem] font-bold tracking-tight capitalize">{dayLabelText}</p>

            {onToggleBlockDay &&
              (confirmingBlock ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3 text-sm">
                  <span className="text-muted-foreground">¿Bloquear este día completo?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await onToggleBlockDay(selectedDay, dayBlocked)
                      setConfirmingBlock(false)
                    }}
                    disabled={blockPending}
                  >
                    {blockPending ? 'Bloqueando…' : 'Sí, bloquear'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmingBlock(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : dayBlocked ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <span className="font-display text-xs font-medium text-destructive">
                    Día bloqueado
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleBlockDay(selectedDay, dayBlocked)}
                    disabled={blockPending}
                  >
                    {blockPending ? 'Desbloqueando…' : 'Desbloquear'}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setConfirmingBlock(true)}>
                    Bloquear día
                  </Button>
                </div>
              ))}

            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : dayBlocked && !onToggleBlockDay ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="size-3.5" strokeWidth={1.8} />
                Día bloqueado.
              </p>
            ) : (
              <DayTimeline
                daySessions={daySessions}
                blocked={dayBlocked}
                selectedDay={selectedDay}
                onSelectSession={onSelectSession}
                onLongPressSession={onLongPressSession}
                onMoveSession={onMoveSession}
                onSelectSlot={(time) => onSelectSlot(selectedDay, time)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Timeline de horas del día: franjas vacías tocables para agendar + bloques
 * de las sesiones ya agendadas. Swipe horizontal cambia de día (arriba). */
/** Milisegundos que hay que mantener presionada una cita para armar el
 * arrastre (o abrir el menú Reagendar/Eliminar, si no se mueve después). */
const LONG_PRESS_MS = 450
/** Movimiento mínimo (px), ya armado el long-press, para contar como
 * arrastre real y no como una pulsación sostenida sin mover el dedo. */
const DRAG_THRESHOLD = 8
/** Arrastrar verticalmente ajusta la hora en saltos de 15 minutos. */
const SNAP_MINUTES = 15

/** Chip verde "Pagado" para las citas cuyo proyecto ya se pagó completo. */
export function PaidBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-income px-1.5 py-px text-[11px] font-semibold text-income-foreground">
      <Check className="size-3" strokeWidth={3} aria-hidden="true" />
      Pagado
    </span>
  )
}

/** Hay citas activas ese día y TODAS son de proyectos ya pagados. */
function allSessionsPaid(sessions: SessionWithProject[] | undefined): boolean {
  const active = (sessions ?? []).filter((s) => s.status !== 'cancelled')
  return active.length > 0 && active.every((s) => isProjectFullyPaid(s.projects))
}

/** Hay citas activas ese día y TODAS están finalizadas o pagadas (verde). */
function allSessionsGreen(sessions: SessionWithProject[] | undefined): boolean {
  const active = (sessions ?? []).filter((s) => s.status !== 'cancelled')
  return active.length > 0 && active.every(isSessionGreen)
}

function minutesToHHmm(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function DayTimeline({
  daySessions,
  blocked,
  selectedDay,
  onSelectSession,
  onLongPressSession,
  onMoveSession,
  onSelectSlot,
}: {
  daySessions: SessionWithProject[]
  blocked: boolean
  /** Día que se está viendo — para saber a qué día mover la cita cuando el
   * arrastre es solo vertical (misma fecha, otra hora). */
  selectedDay: string
  onSelectSession: (s: SessionWithProject) => void
  onLongPressSession?: (s: SessionWithProject) => void
  /** Si se pasa, mantener presionada una cita y luego arrastrarla la mueve:
   * verticalmente cambia la hora (mismo día); soltada sobre uno de los días
   * de la franja de arriba, cambia de día (misma hora). */
  onMoveSession?: (session: SessionWithProject, newDayKey: string, newTime: string) => void
  onSelectSlot: (time: string) => void
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressed = useRef(false)
  const pressStart = useRef({ x: 0, y: 0 })
  const [drag, setDrag] = useState<{
    session: SessionWithProject
    dx: number
    dy: number
    hoverDayKey: string | null
  } | null>(null)

  function clearPressTimer() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  function clearDropHighlight() {
    document
      .querySelectorAll('[data-day-picker]')
      .forEach((el) => el.removeAttribute('data-drop-hover'))
  }

  function startPress(e: React.PointerEvent, s: SessionWithProject) {
    if (!onLongPressSession && !onMoveSession) return
    longPressed.current = false
    pressStart.current = { x: e.clientX, y: e.clientY }
    clearPressTimer()
    // Captura el puntero: sin esto, en cuanto el dedo sale de los límites
    // del botón (inevitable al arrastrar) dejaríamos de recibir
    // pointermove/pointerup — tanto la cancelación por scroll como el
    // arrastre en sí dependen de seguir recibiendo estos eventos.
    e.currentTarget.setPointerCapture(e.pointerId)
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      if (navigator.vibrate) navigator.vibrate(15)
      if (onMoveSession) {
        setDrag({ session: s, dx: 0, dy: 0, hoverDayKey: null })
      } else {
        onLongPressSession?.(s)
      }
    }, LONG_PRESS_MS)
  }

  function movePress(e: React.PointerEvent) {
    // Antes de armar el long-press: si se mueve como un scroll, cancelarlo.
    if (pressTimer.current) {
      const dx0 = e.clientX - pressStart.current.x
      const dy0 = e.clientY - pressStart.current.y
      if (Math.hypot(dx0, dy0) > 10) clearPressTimer()
      return
    }
    // Ya armado: si hay arrastre en curso, seguir el dedo y detectar si
    // está sobre uno de los días de la franja de arriba.
    if (!drag) return
    const dx = e.clientX - pressStart.current.x
    const dy = e.clientY - pressStart.current.y
    const hit = document.elementFromPoint(e.clientX, e.clientY)
    const dayPill = hit?.closest('[data-day-picker]') as HTMLElement | null
    const hoverDayKey = dayPill?.getAttribute('data-day-picker') ?? null
    clearDropHighlight()
    if (dayPill) dayPill.setAttribute('data-drop-hover', 'true')
    setDrag((prev) => (prev ? { ...prev, dx, dy, hoverDayKey } : prev))
  }

  function endPress() {
    clearPressTimer()
    clearDropHighlight()
    if (!drag) return
    const moved = Math.hypot(drag.dx, drag.dy) > DRAG_THRESHOLD
    if (moved && onMoveSession) {
      const origMinutes = minutesOfDay(drag.session.scheduled_at)
      const newMinutes = drag.hoverDayKey
        ? origMinutes
        : origMinutes + Math.round((drag.dy / HOUR_PX) * 60 / SNAP_MINUTES) * SNAP_MINUTES
      onMoveSession(drag.session, drag.hoverDayKey ?? selectedDay, minutesToHHmm(newMinutes))
    } else if (!moved && onLongPressSession) {
      onLongPressSession(drag.session)
    }
    setDrag(null)
  }

  let startH = 8
  let endH = 20
  for (const s of daySessions) {
    const m = minutesOfDay(s.scheduled_at)
    const endM = m + (s.duration_minutes ?? 60)
    startH = Math.min(startH, Math.floor(m / 60))
    endH = Math.max(endH, Math.ceil(endM / 60))
  }
  const hours: number[] = []
  for (let h = startH; h <= endH; h++) hours.push(h)
  const startMin = startH * 60

  return (
    <div className="rounded-2xl bg-background p-3">
      {daySessions.length === 0 && !blocked && (
        <p className="pb-2 text-center text-xs text-muted-foreground">
          Sin sesiones este día — toca una hora para agendar.
        </p>
      )}
      {drag && (
        <p className="pb-2 text-center text-xs font-medium text-primary">
          {drag.hoverDayKey
            ? 'Suelta para mover a este día'
            : `Mover a las ${minutesToHHmm(
                minutesOfDay(drag.session.scheduled_at) +
                  Math.round((drag.dy / HOUR_PX) * 60 / SNAP_MINUTES) * SNAP_MINUTES
              )}`}
        </p>
      )}
      <div className="relative" style={{ height: hours.length * HOUR_PX }}>
        {hours.map((h, i) => (
          <div key={h} className="absolute inset-x-0 flex items-start gap-2" style={{ top: i * HOUR_PX }}>
            <span className="w-12 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
              {labelHour(h * 60)}
            </span>
            <div className="mt-2 h-px flex-1 bg-border" />
          </div>
        ))}
        {!blocked &&
          hours.map((h, i) => (
            <button
              key={`slot-${h}`}
              type="button"
              aria-label={`Agendar cita a las ${labelHour(h * 60)}`}
              onClick={() => onSelectSlot(`${String(h).padStart(2, '0')}:00`)}
              style={{ top: i * HOUR_PX, height: HOUR_PX }}
              className="absolute right-1 left-14 z-0 rounded-lg transition-colors hover:bg-primary/10"
            />
          ))}
        {daySessions.map((s) => {
          const m = minutesOfDay(s.scheduled_at)
          const top = ((m - startMin) / 60) * HOUR_PX
          const height = Math.max(28, ((s.duration_minutes ?? 60) / 60) * HOUR_PX)
          const isDragging = drag?.session.id === s.id
          const paid = s.status !== 'cancelled' && isProjectFullyPaid(s.projects)
          const green = isSessionGreen(s)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (longPressed.current) {
                  longPressed.current = false
                  return
                }
                onSelectSession(s)
              }}
              onPointerDown={(e) => startPress(e, s)}
              onPointerMove={movePress}
              onPointerUp={endPress}
              onPointerCancel={endPress}
              onContextMenu={(e) => {
                if (onLongPressSession || onMoveSession) e.preventDefault()
              }}
              style={{
                top,
                height,
                touchAction: isDragging ? 'none' : 'pan-y',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                transform:
                  drag && isDragging
                    ? drag.hoverDayKey
                      ? 'scale(1.03)'
                      : `translateY(${drag.dy}px) scale(1.03)`
                    : undefined,
                zIndex: isDragging ? 20 : 10,
                boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.35)' : undefined,
              }}
              className={cn(
                'absolute right-1 left-14 overflow-hidden rounded-lg border px-2 py-1 text-left transition-colors hover:border-primary/50',
                s.status === 'cancelled'
                  ? 'bg-muted/40 opacity-60'
                  : green
                    ? 'border-income/60 bg-income/20'
                    : 'bg-primary/15',
                isDragging && 'border-primary opacity-90'
              )}
            >
              <div className="flex items-center gap-1.5">
                <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                  {s.projects?.clients?.name ?? s.projects?.name ?? 'Sesión'}
                </p>
                {paid && <PaidBadge />}
              </div>
              <p className="truncate text-[12px] text-muted-foreground">
                {formatTime(s.scheduled_at)} · {s.projects?.name ?? ''}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
