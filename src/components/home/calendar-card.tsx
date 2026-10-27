'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { CaretRight } from '@phosphor-icons/react'
import { MonthGrid } from '@/components/home/month-grid'
import { HomeCalendarDialog } from '@/components/home/home-calendar-dialog'
import { QuickScheduleDialog } from '@/components/calendar/quick-schedule-dialog'
import { AgendaListDialog, OPEN_AGENDA_EVENT } from '@/components/home/agenda-list-dialog'
import type { ProjectBalance } from '@/components/home/today-appointments'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Tarjeta "Calendario" del Inicio: mes completo arriba (hoy destacado, días
 * con cita/bloqueados marcados) + conteo de sesiones de hoy. Tocar un día
 * abre el popup de calendario (Día/Semana/Mes) sin salir de Inicio — es el
 * ÚNICO calendario de la app (ya no existe la página `/dashboard/calendar`).
 *
 * Cualquier otro lugar de la app que antes enlazaba a esa página ahora
 * enlaza a `/dashboard?openCalendar=1`: este componente detecta ese query
 * param al montar y abre el popup solo, en vista Mes, sin que la persona
 * tenga que tocar nada más.
 */
export function CalendarCard({
  days,
  today,
  todaySessions,
  blockedDays = [],
}: {
  days: { key: string; count: number; paid?: boolean; green?: boolean }[]
  today: string
  todaySessions: SessionWithProject[]
  balances: Record<string, ProjectBalance>
  blockedDays?: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(today)
  const [initialView, setInitialView] = useState<'day' | 'month'>('day')
  const [agendaOpen, setAgendaOpen] = useState(false)
  // Tocar un día del mes abre directo "Agendar cita" para ese día.
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const count = todaySessions.length

  useEffect(() => {
    if (searchParams.get('openCalendar') !== '1') return
    setSelectedDay(today)
    setInitialView('month')
    setDialogOpen(true)
    // Limpia el query param para que un refresh no vuelva a abrir el popup.
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Botón "Agenda" del menú-pulpo (`/dashboard?openAgenda=1`): abre el
  // listado plano de citas (`AgendaListDialog`), no el calendario Mes.
  useEffect(() => {
    if (searchParams.get('openAgenda') !== '1') return
    setAgendaOpen(true)
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Tarjeta "citas" de Inicio (u otro botón) → listado de citas.
  useEffect(() => {
    const open = () => setAgendaOpen(true)
    window.addEventListener(OPEN_AGENDA_EVENT, open)
    return () => window.removeEventListener(OPEN_AGENDA_EVENT, open)
  }, [])

  return (
    <section className="space-y-3 rounded-[2rem] bg-card p-4 sm:p-5" data-tour="calendar-card">
      <div data-tour="calendar-week-strip">
        <MonthGrid
          days={days}
          today={today}
          blockedDays={blockedDays}
          action={
            <button
              type="button"
              onClick={() => {
                setSelectedDay(today)
                setInitialView('month')
                setDialogOpen(true)
              }}
              className="shrink-0 rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.95]"
            >
              Ver todo
            </button>
          }
          onSelectDay={(key) => {
            setSelectedDay(key)
            // Día con citas → su horario (desde ahí se agenda en un hueco libre).
            // Día libre → directo a "Agendar cita".
            if (days.some((d) => d.key === key && d.count > 0)) {
              setInitialView('day')
              setDialogOpen(true)
            } else {
              setScheduleOpen(true)
            }
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setSelectedDay(today)
          setInitialView('day')
          setDialogOpen(true)
        }}
        className="flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          {count === 0 ? 'Sin sesiones hoy' : `${count} ${count === 1 ? 'sesión' : 'sesiones'} hoy`}
        </span>
        <CaretRight className="size-4 text-muted-foreground" weight="bold" />
      </button>

      <HomeCalendarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDay={selectedDay}
        initialView={initialView}
      />

      <QuickScheduleDialog
        dayKey={selectedDay}
        defaultTime="10:00"
        editableTime
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onViewDay={() => {
          setScheduleOpen(false)
          setInitialView('day')
          setDialogOpen(true)
        }}
      />

      <AgendaListDialog open={agendaOpen} onOpenChange={setAgendaOpen} />
    </section>
  )
}
