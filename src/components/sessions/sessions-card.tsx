'use client'

import { Icon3D } from '@/components/ui/icon-3d'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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
        className="tile-indigo flex min-h-[6.5rem] w-full items-center gap-4 rounded-[2rem] px-5 py-4 text-left text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        <Icon3D name="spiral-calendar" className="size-14" />
        <span className="min-w-0 flex-1">
          <span className="block text-[1.375rem] leading-tight font-bold tracking-tight">Sesiones</span>
          <span className="block truncate text-[15px] text-white/75">
            {done} de {total} · {nextDate ? `próxima ${formatSessionDate(nextDate)}` : 'sin próximas'}
          </span>
        </span>
        <ChevronRight className="size-6 shrink-0 text-white/80" strokeWidth={2.4} />
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
