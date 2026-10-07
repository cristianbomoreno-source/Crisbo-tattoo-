'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { CajaDialog } from '@/components/home/caja-dialog'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'

/** Botón "Caja" — acción principal integrada en la tarjeta "Resumen del
 * día" (antes ocupaba una fila propia debajo). Abre el popup de cobros
 * (ver `CajaDialog`). */
export function CajaButton({
  projects,
  todaySessions,
  paymentMethods,
}: {
  projects: ProjectSummary[]
  todaySessions: SessionWithProject[]
  paymentMethods?: string[] | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Wallet className="size-5" strokeWidth={2.2} />
        Caja
      </button>

      <CajaDialog
        open={open}
        onOpenChange={setOpen}
        projects={projects}
        todaySessions={todaySessions}
        paymentMethods={paymentMethods}
      />
    </>
  )
}
