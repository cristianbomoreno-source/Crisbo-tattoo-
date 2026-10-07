'use client'

import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'

import { ScheduleSessionsDialog } from '@/components/calendar/schedule-sessions-dialog'
import { parseDurationLabel } from '@/components/quote-wizard/step-price'

/** Botón circular junto a "Duración estimada" en el detalle de cotización —
 * solo aparece si la cotización ya se convirtió en proyecto (hay
 * `projectId`). Abre el mismo diálogo de agendamiento que usa el flujo de
 * cotización rápida, sin duplicar lógica. `avgSessionDuration`: la
 * duración por sesión que ya se cotizó (ej. "5h 00m") — precarga el dial
 * del popup en vez de quedar siempre en 60 min por default. */
export function ScheduleSessionButton({
  projectId,
  sessionCount,
  avgSessionDuration,
}: {
  projectId: string
  sessionCount: number
  avgSessionDuration?: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar cita"
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
      >
        <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
      </button>
      <ScheduleSessionsDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        sessionCount={sessionCount}
        initialDurationMinutes={parseDurationLabel(avgSessionDuration) ?? undefined}
      />
    </>
  )
}
