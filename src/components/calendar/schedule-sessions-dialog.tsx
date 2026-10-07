'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, ChevronLeft } from 'lucide-react'

import { getCalendarPopupDataAction } from '@/actions/availability'
import { createSessionAction, getBookingConfirmationLinkAction } from '@/actions/sessions'
import { openWhatsAppTab, redirectWhatsAppTab } from '@/lib/whatsapp-client'
import { CalendarNav, type CalendarView } from '@/components/calendar/calendar-nav'
import { DurationDial } from '@/components/sessions/duration-dial'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { shiftMonth, dayKey, todayKey } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Agenda las sesiones de un proyecto recién creado (cotización rápida →
 * "Crear proyecto"). Mismo `CalendarNav` que el resto de la app: tocar una
 * franja vacía en la vista Día elige esa fecha y hora para la sesión actual
 * y avanza a la siguiente — un paso por sesión, misma duración para todas
 * (el dial de abajo). Con 1 sola sesión la UI se simplifica: sin contador
 * "Sesión X de N" ni botón "Atrás".
 */
export function ScheduleSessionsDialog({
  open,
  onOpenChange,
  projectId,
  sessionCount,
  initialDurationMinutes,
  onScheduled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  sessionCount: number
  /** Duración por sesión ya elegida en la cotización (ej. "5h" -> 300) —
   * precarga el dial en vez de quedar siempre en 60 min por default. */
  initialDurationMinutes?: number
  onScheduled?: () => void
}) {
  const router = useRouter()
  const total = Math.max(1, sessionCount)
  const today = todayKey()

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Array<{ day: string; time: string } | null>>(() =>
    Array.from({ length: total }, () => null)
  )
  const [duration, setDuration] = useState(initialDurationMinutes ?? 60)
  const [loading, setLoading] = useState(false)

  const [view, setView] = useState<CalendarView>('day')
  const [monthKey, setMonthKey] = useState(() => today.slice(0, 7))
  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState<SessionWithProject[]>([])
  const [blockedDays, setBlockedDays] = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (!open) return
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

  const isLast = step === total - 1

  function reset() {
    setStep(0)
    setValues(Array.from({ length: total }, () => null))
  }

  async function handlePickSlot(dKey: string, time: string) {
    const next = values.map((v, i) => (i === step ? { day: dKey, time } : v))
    setValues(next)

    if (!isLast) {
      setStep((s) => s + 1)
      return
    }

    // Última sesión: se agendan todas, en orden — si una falla (día
    // bloqueado, choque de horario), se detiene ahí y vuelve a esa sesión
    // para corregirla, sin perder las que ya quedaron creadas.
    setLoading(true)
    // Igual que en el resto de flujos de agendar: se abre YA (síncrono con
    // el tap del slot) para que Safari/iOS no bloquee el popup. Solo con
    // UNA sesión (lo más común al convertir una cotización) -- con varias
    // no hay una cita puntual que confirmar.
    const waTab = total === 1 ? openWhatsAppTab() : null
    const createdIds: string[] = []
    for (let i = 0; i < total; i++) {
      const v = next[i]
      if (!v) continue
      const res = await createSessionAction({
        project_id: projectId,
        scheduled_at: `${v.day}T${v.time}`,
        duration_minutes: duration,
      })
      if (!res.success) {
        setLoading(false)
        toast.error(total > 1 ? `Sesión ${i + 1}: ${res.error.message}` : res.error.message)
        setStep(i)
        redirectWhatsAppTab(waTab, null)
        return
      }
      createdIds.push(res.data.id)
    }
    setLoading(false)
    toast.success(total > 1 ? 'Sesiones agendadas' : 'Sesión agendada')
    onOpenChange(false)
    reset()
    onScheduled?.()
    router.refresh()

    if (waTab && createdIds[0]) {
      const linkRes = await getBookingConfirmationLinkAction(createdIds[0])
      redirectWhatsAppTab(waTab, linkRes.success ? linkRes.data.link : null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-primary" strokeWidth={2} />
            {total > 1 ? `Sesión ${step + 1} de ${total} — elige fecha y hora` : 'Agendar sesión'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DurationDial value={duration} onChange={setDuration} />

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

          {total > 1 && step > 0 && (
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep((s) => s - 1)} disabled={loading}>
              <ChevronLeft className="size-4" />
              Sesión anterior
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
