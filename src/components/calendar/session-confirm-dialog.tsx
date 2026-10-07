'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getBookingConfirmationLinkAction } from '@/actions/sessions'
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
}: {
  session: SessionWithProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToProject: (session: SessionWithProject) => void
}) {
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) setSending(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{clientName}</DialogTitle>
        </DialogHeader>

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
        </div>
      </DialogContent>
    </Dialog>
  )
}
