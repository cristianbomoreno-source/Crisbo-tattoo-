'use client'

import type { ReactElement } from 'react'
import { FormSheet } from '@/components/shared/form-sheet'
import { ClientForm } from '@/components/clients/client-form'

export function CreateClientDialog({ trigger }: { trigger?: ReactElement }) {
  return (
    <FormSheet triggerLabel="Nuevo cliente" title="Nuevo cliente" trigger={trigger}>
      {(close) => <ClientForm onSuccess={close} />}
    </FormSheet>
  )
}
