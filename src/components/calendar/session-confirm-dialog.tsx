'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, ArrowUpRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getBookingConfirmationLinkAction, deleteSessionAction } from '@/actions/sessions'
import { openWhatsAppTab, redirectWhatsAppTab } from '@/lib/whatsapp-client'
import { formatTime } from '@/lib/calendar/utils'
import type { SessionWithProject } from '@/queries/sessions'

/**
 * Se abre al TOCAR (tap corto) una cita ya agendada en la vista Día del
 * calendario -- distinto del menú de mantener presionada
 * (`SessionActionsDialog`, que es Reagendar/Eliminar). Dos acciones: mandar
 * el mensaje de confirmación por WhatsApp (misma plantilla y misma acción
 * que se usa al crear una cita nueva), o ir directo a la ficha del
 * proyecto.
 */
export function SessionConfirmDialog({
  session,
  open,
  onOpenChange,
  onGoToProject,
  onDeleted,
}: {
  session: SessionWithProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToProject: (session: SessionWithProject) => void
  onDeleted?: () => void
}) {
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<'menu' | 'confirmDelete'>('menu')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setSending(false)
      setMode('menu')
    }
  }, [open, session?.id])

  if (!session) return null

  const clientName = session.projects?.clients?.name ?? session.projects?.name ?? 'Sesión'

  async function handleConfirm() {
    if (!session) return
    setSending(true)
    // Abrir YA, síncrono con el tap -- si se espera la respuesta del
    // servidor antes de abrir, Safari/iOS bloquea el popup.
    const waTab = openWhatsAppTab()
    const linkRes = await getBookingConfirmationLinkAction(session.id)
    setSending(false)
    if (!linkRes.success) {
      toast.error(linkRes.error.message)
      redirectWhatsAppTab(waTab, null)
      return
    }
    if (!linkRes.data.link) {
      toast.error('Este cliente no tiene teléfono guardado')
      redirectWhatsAppTab(waTab, null)
      return
    }
    redirectWhatsAppTab(waTab, linkRes.data.link)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!session) return
    setDeleting(true)
    const result = await deleteSessionAction(session.id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cita cancelada')
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === 'confirmDelete' ? 'Cancelar cita' : clientName}</DialogTitle>
        </DialogHeader>

        {mode === 'menu' && (
          <>
            <p className="text-sm text-muted-foreground">
              {formatTime(session.scheduled_at)} · {session.projects?.name ?? ''}
            </p>

            <div className="grid gap-2">
              <Button
                type="button"
                className="justify-start gap-2 bg-[#25D366] text-white hover:bg-[#25D366]/90"
                onClick={handleConfirm}
                disabled={sending}
              >
                <MessageCircle className="size-4" strokeWidth={2} />
                {sending ? 'Abriendo…' : 'Confirmar cita'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                onClick={() => onGoToProject(session)}
              >
                <ArrowUpRight className="size-4" strokeWidth={2} />
                Ver proyecto
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => setMode('confirmDelete')}
              >
                <Trash2 className="size-4" strokeWidth={2} />
                Cancelar cita
              </Button>
            </div>
          </>
        )}

        {mode === 'confirmDelete' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Cancelar la cita con <span className="font-medium text-foreground">{clientName}</span>? Esta acción
              no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMode('menu')} disabled={deleting}>
                Volver
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Cancelando…' : 'Sí, cancelar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
