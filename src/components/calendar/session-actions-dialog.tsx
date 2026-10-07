'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { CalendarClock, Trash2 } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RescheduleSessionForm } from '@/components/sessions/reschedule-session'
import { deleteSessionAction } from '@/actions/sessions'
import { formatTime } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Se abre al mantener presionada una cita en la vista Día del calendario
 * (`onLongPressSession`). Menú de dos pasos, mismo patrón que "Bloquear
 * día" en `calendar-nav.tsx`: primero elegir Reagendar/Eliminar, Eliminar
 * pide una confirmación explícita antes de borrar (a diferencia del
 * swipe-to-delete de cotizaciones, acá el gesto de mantener presionado no
 * es en sí mismo una confirmación de borrado).
 */
export function SessionActionsDialog({
  session,
  open,
  onOpenChange,
  onChanged,
}: {
  session: SessionWithProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Se llama tras reagendar o eliminar, para que quien use este diálogo refresque sus datos. */
  onChanged: () => void
}) {
  const [mode, setMode] = React.useState<'menu' | 'reschedule' | 'confirmDelete'>('menu')
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (open) setMode('menu')
  }, [open, session?.id])

  if (!session) return null

  const clientName = session.projects?.clients?.name ?? session.projects?.name ?? 'Sesión'

  async function handleDelete() {
    if (!session) return
    setDeleting(true)
    const result = await deleteSessionAction(session.id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cita eliminada')
    onOpenChange(false)
    onChanged()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'reschedule' ? 'Reagendar cita' : mode === 'confirmDelete' ? 'Eliminar cita' : clientName}
          </DialogTitle>
        </DialogHeader>

        {mode === 'menu' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatTime(session.scheduled_at)} · {session.projects?.name ?? ''}
            </p>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => setMode('reschedule')}>
                <CalendarClock className="size-4" />
                Reagendar
              </Button>
              <Button
                variant="outline"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setMode('confirmDelete')}
              >
                <Trash2 className="size-4" />
                Eliminar cita
              </Button>
            </div>
          </div>
        )}

        {mode === 'reschedule' && (
          <RescheduleSessionForm
            sessionId={session.id}
            scheduledAt={session.scheduled_at}
            durationMinutes={session.duration_minutes ?? 60}
            projectId={session.project_id}
            onDone={() => {
              onOpenChange(false)
              onChanged()
            }}
          />
        )}

        {mode === 'confirmDelete' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar la cita con <span className="font-medium text-foreground">{clientName}</span>? Esta acción
              no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMode('menu')} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
