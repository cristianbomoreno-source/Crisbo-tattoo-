import { Banknote, CalendarDays, MapPin, Receipt, type LucideIcon } from 'lucide-react'

/** Íconos de las respuestas rápidas que se muestran como botón en el chat
 * (mismos valores que el CHECK de `wa_quick_replies.icon`). */
export const QUICK_REPLY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  payment: { icon: Banknote, label: 'Pago' },
  receipt: { icon: Receipt, label: 'Recibo' },
  calendar: { icon: CalendarDays, label: 'Cita' },
  location: { icon: MapPin, label: 'Ubicación' },
}
