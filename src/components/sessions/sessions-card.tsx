'use client'

import { useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectSessions } from '@/components/sessions/project-sessions'
import { formatSessionDate } from '@/lib/projects/metrics'

type S = { id: string; status: string; scheduled_at: string; duration_minutes: number }
type Pay = { id: string; amount: number; session_id: string | null }

/** Tarjeta compacta "Sesiones" (estilo Resumen del día de Inicio): resumen +
 * tocar cualquier parte abre el detalle completo en un popup, en vez de
 * mostrar la lista siempre desplegada en la página. */
export function SessionsCard({
  projectId,
  sessions,
  payments,
  done,
  total,
  nextDate,
}: {
  projectId: string
  sessions: S[]
  payments: Pay[]
  done: number
  total: number
  nextDate: Date | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-[1.75rem] bg-card p-5 text-left transition-colors hover:bg-card/80 sm:p-6"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <CalendarDays className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">Sesiones</span>
          <span className="block text-sm text-muted-foreground">
            {done} de {total} · {nextDate ? `próxima ${formatSessionDate(nextDate)}` : 'sin próximas'}
          </span>
        </span>
        <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sesiones</DialogTitle>
          </DialogHeader>
          <ProjectSessions projectId={projectId} sessions={sessions} payments={payments} />
        </DialogContent>
      </Dialog>
    </>
  )
}
