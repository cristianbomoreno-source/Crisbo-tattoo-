'use client'

import { Pencil, CircleDollarSign } from 'lucide-react'

import { FormSheet } from '@/components/shared/form-sheet'
import { QuoteForm } from '@/components/quotes/quote-form'
import { TattooMachineIcon } from '@/components/quotes/tattoo-machine-icon'
import { Button } from '@/components/ui/button'
import type { QuoteWithClient } from '@/queries/quotes'

/** Sin precio todavía: el botón invita a "Agregar precio" (más claro que
 * "Editar" para una cotización recién llegada del bot). Una vez tiene
 * precio, vuelve a ser "Editar" — mismo formulario en ambos casos. */
export function EditQuoteButton({
  quote,
  referencePhotos,
  className,
}: {
  quote: QuoteWithClient
  referencePhotos?: string[]
  className?: string
}) {
  const hasPrice = quote.is_courtesy || quote.price != null
  const title = hasPrice ? 'Editar cotización' : 'Agregar precio'
  const subtitle = hasPrice ? 'Actualiza los detalles del proyecto' : 'Define el precio de esta cotización'

  return (
    <FormSheet
      title={title}
      description={subtitle}
      popupClassName="!bg-[#0D0D0D] sm:!max-w-md"
      closeButtonClassName="rounded-full border border-[#2B2B2B] text-primary hover:bg-primary/10"
      header={
        <div className="mb-1 flex items-start gap-3 pr-10">
          <TattooMachineIcon className="size-14 shrink-0 text-primary" />
          <div>
            <h2 className="font-title text-2xl leading-tight text-white">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      }
      trigger={
        <Button variant={hasPrice ? 'outline' : 'default'} size="sm" className={className}>
          {hasPrice ? <Pencil className="size-4" /> : <CircleDollarSign className="size-4" />}
          {hasPrice ? 'Editar' : 'Agregar precio'}
        </Button>
      }
    >
      {(close) => (
        <QuoteForm clients={[]} quote={quote} referencePhotos={referencePhotos} onSuccess={close} />
      )}
    </FormSheet>
  )
}
