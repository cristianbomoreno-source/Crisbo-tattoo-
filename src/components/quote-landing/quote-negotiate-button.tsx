'use client'

import { useState } from 'react'
import { HandCoins } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'

/**
 * Solo se muestra si el estudio activó "Permitir que el cliente proponga
 * otro valor" (Ajustes → Cotizaciones → Carta y negociación). El cliente
 * escribe su presupuesto y esto arma el mensaje de WhatsApp pedido:
 * "Hola {artista}, estuve analizando tu cotización... no puedo llegar al
 * {precio}... mi presupuesto es de {presupuesto}...".
 */
export function QuoteNegotiateButton({
  artistName,
  price,
  whatsappPhone,
  color,
}: {
  artistName: string
  price: number
  whatsappPhone: string | null
  color: string
}) {
  const [open, setOpen] = useState(false)
  const [budget, setBudget] = useState('')

  if (!whatsappPhone) return null

  function send() {
    const amount = budget.replace(/\D/g, '')
    if (!amount) return
    const priceLabel = `$${Math.round(price).toLocaleString('es-CO')}`
    const budgetLabel = `$${Number(amount).toLocaleString('es-CO')}`
    const message = `Hola ${artistName}, estuve analizando tu cotización y realmente me encantaría tatuarme contigo. El valor de ${priceLabel} está un poco fuera de mi presupuesto, así que quiero hacerte una propuesta: mi presupuesto es de ${budgetLabel}. Me encantaría que la pudieras evaluar con tu equipo de trabajo. Quedo muy atento, ¡gracias!`
    const link = waLink(whatsappPhone, message)
    if (link) window.open(link, '_blank', 'noopener')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/12 py-2.5 text-sm text-white/70"
      >
        <HandCoins className="size-4" style={{ color }} />
        ¿Está fuera de tu presupuesto? Hazme una propuesta
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/12 p-4">
      <p className="text-sm leading-relaxed text-white/70">
        Si este valor está fuera de tu presupuesto, hazme una propuesta y la evaluamos juntos con
        nuestro equipo de trabajo.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          inputMode="numeric"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Ej. 500.000"
          className="h-11 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 text-[15px] text-white outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={send}
          disabled={!budget.replace(/\D/g, '')}
          className="h-11 shrink-0 rounded-xl px-4 text-sm font-semibold text-black disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
