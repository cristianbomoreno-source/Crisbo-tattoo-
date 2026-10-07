'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ChevronRight, CalendarDays } from 'lucide-react'
import { WeekStrip } from '@/components/home/week-strip'
import { HomeCalendarDialog } from '@/components/home/home-calendar-dialog'
import { AgendaListDialog } from '@/components/home/agenda-list-dialog'
import type { ProjectBalance } from '@/components/home/today-appointments'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Tarjeta "Calendario" del Inicio: tira de días arriba (hoy destacado, días
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
  days: { key: string; count: number }[]
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

  return (
    <section className="space-y-3 rounded-[1.5rem] bg-card p-3.5 sm:p-5" data-tour="calendar-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Calendario</h2>
        <button
          type="button"
          onClick={() => {
            setSelectedDay(today)
            setInitialView('month')
            setDialogOpen(true)
          }}
          className="flex items-center gap-0.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver todo
          <ChevronRight className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div data-tour="calendar-week-strip">
        <WeekStrip
          days={days}
          today={today}
          blockedDays={blockedDays}
          onSelectDay={(key) => {
            setSelectedDay(key)
            setInitialView('day')
            setDialogOpen(true)
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
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <CalendarDays className="size-3.5 text-primary" strokeWidth={2} />
        {count === 0 ? 'Sin sesiones hoy' : `${count} ${count === 1 ? 'sesión' : 'sesiones'} hoy`}
      </button>

      <HomeCalendarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDay={selectedDay}
        initialView={initialView}
      />

      <AgendaListDialog open={agendaOpen} onOpenChange={setAgendaOpen} />
    </section>
  )
}
