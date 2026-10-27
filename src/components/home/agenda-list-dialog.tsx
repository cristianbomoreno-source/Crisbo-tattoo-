'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getCalendarPopupDataAction } from '@/actions/availability'
import { dayKey, formatTime, todayKey } from '@/lib/calendar/utils'
import { cn } from '@/lib/utils'
import type { SessionWithProject } from '@/queries/sessions'

/** Abre este popup desde cualquier parte de Inicio (p. ej. la tarjeta "citas"). */
export const OPEN_AGENDA_EVENT = 'crisbo:open-agenda'

const dayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

function dayTitle(key: string, today: string) {
  const diff = Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  const label = dayFmt.format(new Date(`${key}T12:00:00Z`)).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Popup "Citas" (tarjeta de citas de Inicio, o `?openAgenda=1`): todas las
 * citas desde hoy, agrupadas por día con títulos grandes ("Hoy", "Mañana",
 * "Jueves 29 oct"), y cada una como fila de la lista de Apple Games: cuadro
 * dorado con la hora, cliente en negrita, proyecto en gris y flecha al
 * proyecto. A diferencia del calendario Día/Semana/Mes, aquí no se navega
 * por fechas: es para ver de un vistazo qué viene.
 */
export function AgendaListDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithProject[]>([])
  const [loading, setLoading] = useState(false)
  const today = todayKey()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const from = `${today}T00:00:00Z`
    const toD = new Date(`${today}T00:00:00Z`)
    toD.setUTCMonth(toD.getUTCMonth() + 6)
    getCalendarPopupDataAction(from, toD.toISOString()).then((res) => {
      setLoading(false)
      if (res.success) setSessions(res.data.sessions)
    })
  }, [open, today])

  const upcoming = [...sessions]
    .filter((s) => s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const groups: { key: string; items: SessionWithProject[] }[] = []
  for (const s of upcoming) {
    const key = dayKey(s.scheduled_at)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(s)
    else groups.push({ key, items: [s] })
  }

  function goToProject(projectId: string) {
    onOpenChange(false)
    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-5 pt-5 pb-3">
          <DialogTitle className="large-title">Citas</DialogTitle>
          <p className="text-[1.0625rem] text-muted-foreground">
            {loading ? 'Cargando…' : `${upcoming.length} ${upcoming.length === 1 ? 'cita' : 'citas'} por venir`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {!loading && upcoming.length === 0 && <p className="py-6 text-center text-muted-foreground">No tienes citas agendadas.</p>}

          {groups.map((g) => (
            <section key={g.key} className="pt-4">
              <h3 className="mb-2 font-title text-[1.25rem] font-bold tracking-tight">{dayTitle(g.key, today)}</h3>
              <div className="space-y-2.5">
                {g.items.map((s) => {
                  const [hh, rest] = formatTime(s.scheduled_at).split(':')
                  const done = s.status === 'completed'
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goToProject(s.project_id)}
                      className="flex w-full items-center gap-3.5 text-left transition-transform duration-150 ease-out active:scale-[0.98]"
                    >
                      <span
                        className={cn(
                          'grid size-14 shrink-0 place-items-center rounded-[1rem] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
                          done ? 'tile-gray' : 'tile-gold',
                        )}
                      >
                        <span className="text-center leading-none">
                          <span className="block font-title text-[1.0625rem] font-bold tabular-nums">
                            {hh}:{rest?.slice(0, 2)}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-semibold text-white/75 uppercase">{rest?.slice(2).trim()}</span>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[1.0625rem] font-semibold">
                          {s.projects?.clients?.name ?? s.projects?.name ?? 'Sesión'}
                        </span>
                        <span className="block truncate text-[15px] text-muted-foreground">
                          {done ? 'Finalizada · ' : ''}
                          {s.projects?.name ?? 'Sesión'}
                        </span>
                      </span>
                      <CaretRight className="size-5 shrink-0 text-muted-foreground" weight="bold" />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
