'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DurationDial } from '@/components/sessions/duration-dial'
import { CalendarNav, type CalendarView } from '@/components/calendar/calendar-nav'
import { getCalendarPopupDataAction } from '@/actions/availability'
import { rescheduleSessionAction } from '@/actions/sessions'
import { shiftMonth, dayKey, todayKey } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

type Props = {
  sessionId: string
  scheduledAt: string
  durationMinutes: number
  projectId?: string
}

/** Campos de reagendar (fecha/hora + duración) — mismo `CalendarNav` que el
 * resto de la app para elegir el DÍA (y ver qué otras citas hay ese día),
 * pero la HORA ya no queda fija en punto al tocar una franja: tocar solo
 * fija el día y precarga una hora de partida, y un campo "Hora exacta"
 * aparte permite ajustarla a cualquier minuto antes de guardar — antes,
 * tocar la franja reagendaba al instante y redondeaba siempre a :00,
 * sin ninguna forma de dejar la cita a las 14:30, por ejemplo. */
export function RescheduleSessionForm({
  sessionId,
  scheduledAt,
  durationMinutes,
  projectId,
  onDone,
}: Props & { onDone: () => void }) {
  const router = useRouter()
  const today = todayKey()
  const initialDay = dayKey(scheduledAt)
  const initialTime = scheduledAt.slice(11, 16)

  const [duration, setDuration] = React.useState(durationMinutes || 60)
  const [loading, setLoading] = React.useState(false)

  const [view, setView] = React.useState<CalendarView>('day')
  const [monthKey, setMonthKey] = React.useState(initialDay.slice(0, 7))
  const [selectedDay, setSelectedDay] = React.useState(initialDay)
  const [time, setTime] = React.useState(initialTime)
  const [sessions, setSessions] = React.useState<SessionWithProject[]>([])
  const [blockedDays, setBlockedDays] = React.useState<string[]>([])
  const [dataLoading, setDataLoading] = React.useState(false)

  React.useEffect(() => {
    setDataLoading(true)
    const from = `${shiftMonth(monthKey, -1)}-01T00:00:00Z`
    const to = `${shiftMonth(monthKey, 2)}-01T00:00:00Z`
    getCalendarPopupDataAction(from, to).then((res) => {
      setDataLoading(false)
      if (res.success) {
        setSessions(res.data.sessions)
        setBlockedDays(res.data.blockedDays)
      }
    })
  }, [monthKey])

  const blockedSet = React.useMemo(() => new Set(blockedDays), [blockedDays])
  const byDay = React.useMemo(() => {
    const map: Record<string, SessionWithProject[]> = {}
    for (const s of sessions) {
      if (s.status === 'cancelled' || s.id === sessionId) continue
      const k = dayKey(s.scheduled_at)
      map[k] = [...(map[k] ?? []), s]
    }
    return map
  }, [sessions, sessionId])

  // Tocar una franja del día solo fija el día + una hora de partida (la
  // franja tocada) — YA NO reagenda al instante. El botón "Guardar" de
  // abajo es el que confirma, con la hora que haya quedado en el campo
  // "Hora exacta" (que puede ser distinta a la franja tocada).
  function handlePickSlot(dKey: string, hourSlot: string) {
    setSelectedDay(dKey)
    if (dKey !== selectedDay) setTime(hourSlot)
  }

  async function handleSave() {
    if (!time) {
      toast.error('Elige una hora')
      return
    }
    setLoading(true)
    const result = await rescheduleSessionAction(
      sessionId,
      { scheduled_at: `${selectedDay}T${time}`, duration_minutes: duration },
      projectId
    )
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Sesión reagendada')
    onDone()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Duración</Label>
        <DurationDial value={duration} onChange={setDuration} />
      </div>
      <div className="space-y-2">
        <Label>Nuevo día</Label>
        <CalendarNav
          view={view}
          onViewChange={setView}
          monthKey={monthKey}
          onMonthKeyChange={(fn) => setMonthKey(fn)}
          selectedDay={selectedDay}
          onSelectedDayChange={(fn) => setSelectedDay(fn)}
          byDay={byDay}
          blockedSet={blockedSet}
          today={today}
          loading={dataLoading || loading}
          onSelectSession={() => {}}
          onSelectSlot={handlePickSlot}
        />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="reschedule-exact-time">Hora exacta</Label>
          <input
            id="reschedule-exact-time"
            type="time"
            step={60}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base tabular-nums"
          />
        </div>
        <Button type="button" className="h-11" onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedDay} · {time || '—'}
      </p>
    </div>
  )
}

/** Botón + dialog autónomo para reagendar (uso desde el detalle del proyecto). */
export function RescheduleSessionDialog(props: Props) {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <CalendarClock className="size-4" />
            Reagendar
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reagendar sesión</DialogTitle>
        </DialogHeader>
        <RescheduleSessionForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
