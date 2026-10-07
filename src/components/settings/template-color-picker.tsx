'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateQuoteTemplateColor } from '@/actions/studio'
import { QUOTE_TEMPLATE_COLORS, type QuoteTemplateColorId } from '@/lib/pdf/quote-template-data'
import { cn } from '@/lib/utils'

const OPTIONS: { id: QuoteTemplateColorId; label: string }[] = [
  { id: 'green', label: 'Verde OFINK' },
  { id: 'white', label: 'Blanco' },
  { id: 'blue', label: 'Azul' },
  { id: 'red', label: 'Rojo' },
]

/**
 * Color de acento de la plantilla de cotización (imagen que se envía por
 * WhatsApp): título, línea del hero, badge de estado, íconos y QR. El fondo
 * negro nunca cambia. Se guarda en el estudio (afecta la generación en el
 * servidor, por eso no puede vivir solo en localStorage como el menú del
 * pulpo) — ver `updateQuoteTemplateColor` en `actions/studio.ts`.
 */
export function TemplateColorPicker({ initialColor }: { initialColor: string | null }) {
  const [selected, setSelected] = useState<QuoteTemplateColorId>(
    (initialColor as QuoteTemplateColorId) || 'green'
  )
  const [pending, startTransition] = useTransition()

  function select(id: QuoteTemplateColorId) {
    if (id === selected || pending) return
    const prev = selected
    setSelected(id)
    startTransition(async () => {
      const result = await updateQuoteTemplateColor(id)
      if (!result.success) {
        setSelected(prev)
        toast.error('No se pudo guardar el color')
        return
      }
      toast.success('Color de la plantilla actualizado')
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
        Color de la cotización
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Acento de la imagen que le envías al cliente por WhatsApp.
      </p>
      <div className="mt-3 flex gap-2">
        {OPTIONS.map((opt) => {
          const hex = QUOTE_TEMPLATE_COLORS[opt.id]
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => select(opt.id)}
              aria-label={opt.label}
              aria-pressed={active}
              disabled={pending}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors disabled:opacity-60',
                active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              )}
            >
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full border border-white/15"
                style={{ backgroundColor: hex }}
              />
              <span className="text-[10px] leading-none text-muted-foreground">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
