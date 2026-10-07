'use client'

import type { ReactElement } from 'react'
import { FormSheet } from '@/components/shared/form-sheet'
import { ProjectForm } from '@/components/projects/project-form'
import type { Client } from '@/queries/clients'

export function CreateProjectDialog({
  clients,
  trigger,
}: {
  clients: Client[]
  trigger?: ReactElement
}) {
  return (
    <FormSheet triggerLabel="Nuevo proyecto" title="Nuevo proyecto" trigger={trigger}>
      {(close) => <ProjectForm clients={clients} onSuccess={close} />}
    </FormSheet>
  )
}
