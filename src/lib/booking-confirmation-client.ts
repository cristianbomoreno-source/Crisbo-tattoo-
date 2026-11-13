import { toast } from 'sonner'
import { getBookingConfirmationLinkAction, sendBookingConfirmationAction } from '@/actions/sessions'

/** Tras agendar: el mensaje con los datos de la cita sale solo por WhatsApp
 * (API). Si no se pudo (sin WhatsApp conectado, plantilla en revisión…), el
 * aviso trae un botón para abrir WhatsApp con el mensaje listo — es un toque
 * del usuario, así iOS no bloquea la pestaña. */
export async function deliverBookingConfirmation(sessionId: string) {
  const res = await sendBookingConfirmationAction(sessionId)
  if (res.success) {
    toast.success('Datos de la cita enviados al cliente por WhatsApp')
    return
  }
  const linkRes = await getBookingConfirmationLinkAction(sessionId)
  const link = linkRes.success ? linkRes.data.link : null
  toast.error(`No se envió la confirmación de la cita: ${res.error.message}`, {
    duration: 15_000,
    action: link ? { label: 'Abrir WhatsApp', onClick: () => window.open(link, '_blank') } : undefined,
  })
}
