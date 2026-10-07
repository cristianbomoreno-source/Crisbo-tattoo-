'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { buildMessage } from '@/lib/quotes/message'
import { waLink } from '@/lib/whatsapp'
import { createQuoteLinkAction } from '@/actions/quote-links'

/**
 * Botón "Enviar por WhatsApp" para el detalle de una cotización. Ya no
 * comparte una imagen: genera (o renueva, ver `createQuoteLinkAction`) el
 * link de la landing privada del proyecto (7 días de validez) y lo agrega
 * al mensaje. WhatsApp arma el preview del link solo, leyendo el Open
 * Graph de `/api/quote-links/[token]/image` — no hace falta adjuntar nada
 * a mano.
 */
export function SendQuoteWhatsapp({
  quoteId,
  clientName,
  clientPhone,
  template,
  style,
  bodyZone,
  price,
  isCourtesy,
  sessionCount,
  className,
}: {
  quoteId: string
  clientName: string
  clientPhone: string | null
  template: string
  style: string | null
  bodyZone: string | null
  price: number | null
  isCourtesy: boolean
  sessionCount: number | null
  className?: string
}) {
  const [sending, setSending] = React.useState(false)

  const message = buildMessage(template, {
    nombre_cliente: clientName,
    nombre_proyecto: [style, bodyZone].filter(Boolean).join(' — ') || 'tu tatuaje',
    valor: isCourtesy ? 'Cortesía' : `$${Math.round(price ?? 0).toLocaleString('es-CO')}`,
    numero_sesiones: String(sessionCount ?? 1),
  })
  // Sin precio (y no cortesía) el mensaje diría "$0", un dato inventado:
  // no se puede enviar hasta ponerle precio a la cotización.
  const missingPrice = price == null && !isCourtesy
  const disabled = !clientPhone || missingPrice || sending
  const hint = !clientPhone
    ? 'El cliente no tiene teléfono'
    : missingPrice
      ? 'Ponle precio antes de enviar'
      : null

  async function handleClick() {
    if (disabled) return
    setSending(true)
    try {
      const result = await createQuoteLinkAction(quoteId)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      const url = `${window.location.origin}/proyecto/${result.data.token}`
      const link = waLink(clientPhone, `${message}\n\n${url}`)
      if (!link) {
        toast.error('El cliente no tiene teléfono')
        return
      }
      window.open(link, '_blank', 'noopener')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button type="button" variant="default" size="sm" disabled={disabled} onClick={handleClick} className={className}>
        <MessageCircle className="size-4" />
        {sending ? 'Preparando…' : 'Enviar por WhatsApp'}
      </Button>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
