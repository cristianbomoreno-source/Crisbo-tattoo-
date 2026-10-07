'use client'

import type { ReactElement } from 'react'
import { FormSheet } from '@/components/shared/form-sheet'
import { QuoteForm } from '@/components/quotes/quote-form'
import type { Client } from '@/queries/clients'

export function CreateQuoteDialog({
  clients,
  quoteMessageTemplate,
  trigger,
}: {
  clients: Client[]
  quoteMessageTemplate?: string
  trigger?: ReactElement
}) {
  return (
    <FormSheet triggerLabel="Nueva cotización" title="Nueva cotización" trigger={trigger}>
      {(close) => (
        <QuoteForm clients={clients} quoteMessageTemplate={quoteMessageTemplate} onSuccess={close} />
      )}
    </FormSheet>
  )
}
