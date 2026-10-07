import { MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_CONTACT_TEMPLATE } from '@/lib/messages/templates'

/** Botón "Contactar por WhatsApp" — abre wa.me con el teléfono del cliente
 * del proyecto. `null` si el cliente no tiene teléfono guardado (no
 * renderiza nada, mismo criterio que `SendQuoteWhatsapp`). */
export function ContactClientWhatsapp({
  phone,
  clientName,
  projectName,
  template,
  variant = 'icon',
}: {
  phone: string | null | undefined
  clientName: string
  projectName?: string
  /** Plantilla editable (Ajustes → Personalización → Plantillas de WhatsApp).
   * `undefined`/`null` usa el ejemplo por defecto. */
  template?: string | null
  /** 'icon' = círculo compacto para headers/popups. 'full' = botón ancho con texto. */
  variant?: 'icon' | 'full'
}) {
  const message = projectName
    ? buildMessage(template || DEFAULT_CONTACT_TEMPLATE, {
        nombre_cliente: clientName,
        nombre_proyecto: projectName,
      })
    : `Hola ${clientName}!`
  const link = waLink(phone, message)
  if (!link) return null

  if (variant === 'full') {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
        Contactar por WhatsApp
      </a>
    )
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contactar a ${clientName} por WhatsApp`}
      className="flex size-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-90"
    >
      <MessageCircle className="size-4.5" strokeWidth={2} aria-hidden />
    </a>
  )
}
