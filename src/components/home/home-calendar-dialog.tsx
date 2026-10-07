'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getCalendarPopupDataAction } from '@/actions/availability'
import { rescheduleSessionAction } from '@/actions/sessions'
import { QuickScheduleDialog } from '@/components/calendar/quick-schedule-dialog'
import { SessionActionsDialog } from '@/components/calendar/session-actions-dialog'
import { SessionConfirmDialog } from '@/components/calendar/session-confirm-dialog'
import { CalendarNav, type CalendarView } from '@/components/calendar/calendar-nav'
import { shiftMonth, dayKey, todayKey } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Calendario del Inicio en un popup — única pieza de calendario de toda la
 * app (la página completa `/dashboard/calendar` se retiró; esto es lo que
 * abre cualquier "Ver agenda"/"Ver calendario" del resto de la app). Solo
 * aporta CÓMO llegan los datos acá: fetch de cliente
 * (`getCalendarPopupDataAction`) para no salir de la pantalla.
 */
export function HomeCalendarDialog({
  open,
  onOpenChange,
  initialDay,
  initialView = 'day',
  presetProjectId,
  presetClientName,
  presetPhone,
  onScheduled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDay: string
  initialView?: CalendarView
  /** Si viene de un proyecto ya creado (cotización rápida), agenda directo
   * ahí en vez de pedir/crear cliente. */
  presetProjectId?: string
  presetClientName?: string
  presetPhone?: string
  onScheduled?: () => void
}) {
  const router = useRouter()
  const [view, setView] = useState<CalendarView>(initialView)
  const [monthKey, setMonthKey] = useState(() => initialDay.slice(0, 7))
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const [sessions, setSessions] = useState<SessionWithProject[]>([])
  const [blockedDays, setBlockedDays] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const today = todayKey()

  useEffect(() => {
    if (!open) return
    setSelectedDay(initialDay)
    setMonthKey(initialDay.slice(0, 7))
    setView(initialView)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDay])

  function refetch() {
    setLoading(true)
    const from = `${shiftMonth(monthKey, -1)}-01T00:00:00Z`
    const to = `${shiftMonth(monthKey, 2)}-01T00:00:00Z`
    getCalendarPopupDataAction(from, to).then((res) => {
      setLoading(false)
      if (res.success) {
        setSessions(res.data.sessions)
        setBlockedDays(res.data.blockedDays)
      }
    })
  }

  useEffect(() => {
    if (!open) return
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, monthKey])

  const blockedSet = useMemo(() => new Set(blockedDays), [blockedDays])
  const byDay = useMemo(() => {
    const map: Record<string, SessionWithProject[]> = {}
    for (const s of sessions) {
      if (s.status === 'cancelled') continue
      const k = dayKey(s.scheduled_at)
      map[k] = [...(map[k] ?? []), s]
    }
    return map
  }, [sessions])

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('10:00')
  const wasScheduleOpen = useRef(false)
  const [actionsSession, setActionsSession] = useState<SessionWithProject | null>(null)

  useEffect(() => {
    if (wasScheduleOpen.current && !scheduleOpen && open) refetch()
    wasScheduleOpen.current = scheduleOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleOpen, open])

  function goToProject(session: SessionWithProject) {
    onOpenChange(false)
    router.push(`/dashboard/projects/${session.project_id}`)
  }

  const [confirmSession, setConfirmSession] = useState<SessionWithProject | null>(null)

  const [moving, setMoving] = useState(false)

  /** Soltar una cita arrastrada (otra hora, o sobre otro día de la franja
   * de arriba): reagenda directo, sin abrir ningún formulario. Reutiliza
   * la misma validación que "Reagendar" (día bloqueado, choque de horario). */
  async function moveSession(session: SessionWithProject, newDayKey: string, newTime: string) {
    if (moving) return
    setMoving(true)
    const result = await rescheduleSessionAction(
      session.id,
      { scheduled_at: `${newDayKey}T${newTime}`, duration_minutes: session.duration_minutes ?? 60 },
      session.project_id
    )
    setMoving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cita movida')
    refetch()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendario</DialogTitle>
        </DialogHeader>

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
          loading={loading}
          onSelectSession={setConfirmSession}
          onLongPressSession={setActionsSession}
          onMoveSession={moveSession}
          onSelectSlot={(dKey, time) => {
            setSelectedDay(dKey)
            setScheduleTime(time)
            setScheduleOpen(true)
          }}
        />
      </DialogContent>

      <QuickScheduleDialog
        dayKey={selectedDay}
        defaultTime={scheduleTime}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        presetProjectId={presetProjectId}
        presetClientName={presetClientName}
        presetPhone={presetPhone}
        onScheduled={onScheduled}
      />

      <SessionActionsDialog
        session={actionsSession}
        open={!!actionsSession}
        onOpenChange={(o) => {
          if (!o) setActionsSession(null)
        }}
        onChanged={refetch}
      />

      <SessionConfirmDialog
        session={confirmSession}
        open={!!confirmSession}
        onOpenChange={(o) => {
          if (!o) setConfirmSession(null)
        }}
        onGoToProject={(s) => {
          setConfirmSession(null)
          goToProject(s)
        }}
      />
    </Dialog>
  )
}
