'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getCalendarPopupDataAction } from '@/actions/availability'
import { formatTime, todayKey } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Popup "Agenda" (botón del menú-pulpo, `?openAgenda=1`): a diferencia del
 * calendario Día/Semana/Mes (`HomeCalendarDialog`), esto es solo un
 * listado plano de TODAS las citas creadas desde hoy, de la más próxima a
 * la más lejana, cada una con enlace directo al proyecto — para ver de un
 * vistazo qué hay agendado sin navegar por fechas.
 */
export function AgendaListDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithProject[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const today = todayKey()
    const from = `${today}T00:00:00Z`
    const toD = new Date(`${today}T00:00:00Z`)
    toD.setUTCMonth(toD.getUTCMonth() + 6)
    getCalendarPopupDataAction(from, toD.toISOString()).then((res) => {
      setLoading(false)
      if (res.success) setSessions(res.data.sessions)
    })
  }, [open])

  const upcoming = [...sessions]
    .filter((s) => s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  function goToProject(projectId: string) {
    onOpenChange(false)
    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agenda</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes citas agendadas.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToProject(s.project_id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card p-3.5 text-left transition-colors hover:bg-accent/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {s.projects?.clients?.name ?? s.projects?.name ?? 'Sesión'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(s.scheduled_at).toLocaleDateString('es-CO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {formatTime(s.scheduled_at)} · {s.projects?.name ?? ''}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
