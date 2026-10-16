'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, ChevronDown, CircleCheck, CircleDashed, CircleX, MessageCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setSessionConfirmationAction } from '@/actions/sessions'
import type { Confirmation } from '@/lib/appointments/confirmation'

export const CONFIRMATION_STYLES: Record<Confirmation, { label: string; icon: typeof CircleCheck; className: string }> = {
  confirmed: { label: 'Cita confirmada', icon: CircleCheck, className: 'bg-emerald-500 text-white' },
  pending: { label: 'Cita por confirmar', icon: CircleDashed, className: 'bg-amber-400 text-amber-950' },
  cancelled: { label: 'Cita cancelada', icon: CircleX, className: 'bg-destructive text-white' },
}

const ORDER: Confirmation[] = ['confirmed', 'pending', 'cancelled']

/** Botón con el estado de la cita (confirmada / por confirmar / cancelada,
 * según la respuesta al recordatorio). Al tocarlo deja cambiar el estado a
 * mano y abrir el WhatsApp del cliente. Cancelar libera el espacio. */
export function ConfirmationMenu({
  sessionId,
  confirmation,
  waHref,
  onChanged,
  className = '',
}: {
  sessionId: string
  confirmation: Confirmation | null
  waHref?: string | null
  onChanged?: (next: Confirmation) => void
  className?: string
}) {
  const [current, setCurrent] = useState<Confirmation>(confirmation ?? 'pending')
  const [saving, setSaving] = useState(false)
  // La cita puede cambiar (otra tarjeta del carrusel / otro popup).
  const [shownFor, setShownFor] = useState(sessionId)
  if (shownFor !== sessionId) {
    setShownFor(sessionId)
    setCurrent(confirmation ?? 'pending')
  }

  const style = CONFIRMATION_STYLES[current]
  const Icon = style.icon

  async function change(next: Confirmation) {
    if (next === current || saving) return
    const prev = current
    setCurrent(next)
    setSaving(true)
    const res = await setSessionConfirmationAction(sessionId, next)
    setSaving(false)
    if (!res.success) {
      setCurrent(prev)
      toast.error(res.error.message)
      return
    }
    toast.success(CONFIRMATION_STYLES[next].label)
    onChanged?.(next)
  }

  return (
    // Los clics del menú (en portal) no deben llegar a la tarjeta que abre el proyecto.
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="contents">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={saving}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${style.className} ${className}`}
        >
          <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
          {style.label}
          <ChevronDown className="size-3.5 opacity-80" strokeWidth={2.2} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {ORDER.map((c) => {
            const s = CONFIRMATION_STYLES[c]
            const ItemIcon = s.icon
            return (
              <DropdownMenuItem key={c} onClick={() => change(c)}>
                <ItemIcon />
                {s.label}
                {c === current && <Check className="ml-auto" />}
              </DropdownMenuItem>
            )
          })}
          {waHref && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(waHref, '_blank', 'noopener,noreferrer')}>
                <MessageCircle />
                Abrir WhatsApp
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
