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
  pill,
}: {
  projects: ProjectSummary[]
  todaySessions: SessionWithProject[]
  paymentMethods?: string[] | null
  /** Píldora de vidrio ancha ("Registrar cobro"), para la portada de Inicio. */
  pill?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {pill ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex h-14 w-full max-w-72 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/18 text-[1.0625rem] font-semibold text-white backdrop-blur-md transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <Wallet className="size-5" strokeWidth={2.2} />
          Registrar cobro
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Wallet className="size-5" strokeWidth={2.2} />
          Caja
        </button>
      )}

      <CajaDialog open={open} onOpenChange={setOpen} projects={projects} todaySessions={todaySessions} paymentMethods={paymentMethods} />
    </>
  )
}
