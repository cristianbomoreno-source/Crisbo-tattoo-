'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { cop } from '@/lib/projects/metrics'
import { formatTime } from '@/lib/calendar/utils'
import { updateSessionStatusAction } from '@/actions/sessions'
import { ProjectCompletionStep } from '@/components/home/project-completion-step'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { SessionWithProject } from '@/queries/sessions'

/** Saldo por proyecto para mostrar en la fila de la cita. */
export type ProjectBalance = { deposits: number; pending: number }

/**
 * Lista "Sesiones de hoy": hora · avatar · nombre+proyecto · saldo · botón
 * "Finalizar" · chevron al proyecto. El contacto por WhatsApp de la sesión
 * más próxima ya vive en la tarjeta "Próxima sesión" de arriba, así que
 * estas filas se simplifican.
 *
 * `enableTimer` (solo lo prende `HomeDesktop`, NUNCA el Home móvil — ahí el
 * botón ▶ vive únicamente en la tarjeta "Próxima sesión"): agrega el botón
 * ▶/■ de cada cita, con el mismo popup de materiales y la misma acción de
 * servidor que en `NextSessionCard`. Ese botón solo controla el cronómetro;
 * es independiente del botón "Finalizar" de abajo.
 *
 * Botón "Finalizar" (siempre visible, en las dos versiones de Inicio,
 * mientras la cita no esté ya completada/cancelada): marca la cita como
 * completada. Si el proyecto de esa cita YA tenía algún pago registrado de
 * antes, además abre "¿cómo va el proyecto?" (`ProjectCompletionStep`):
 * completado (con foto obligatoria) o % de avance (con barra deslizante).
 * Si el proyecto todavía no tiene ningún pago, no se pregunta nada más —
 * eso se resuelve más tarde desde "Registrar pagos del día", que dispara
 * el mismo paso justo después de registrar el pago.
 */
export function TodayAppointments({
  sessions,
  balances,
  medicalAlertProjectIds,
}: {
  sessions: SessionWithProject[]
  balances: Record<string, ProjectBalance>
  medicalAlertProjectIds?: Set<string>
}) {
  const router = useRouter()
  const [finishingId, setFinishingId] = useState<string | null>(null)
  // Proyecto para el que hay que preguntar "¿cómo va el proyecto?" justo
  // después de finalizar una sesión — solo se llena cuando ESE proyecto ya
  // tenía algún pago registrado de antes (ver handleFinish).
  const [completionFor, setCompletionFor] = useState<string | null>(null)

  /** Botón "Finalizar sesión" de cada fila: marca la cita como completada
   * y, únicamente si el proyecto ya tenía un pago registrado con
   * anterioridad, abre el paso "¿cómo va el proyecto?" (completado con
   * foto, o % de avance con barra) — mismo paso que usa
   * `CajaDialog` justo después de registrar un cobro, ahora
   * compartido vía `ProjectCompletionStep`. Si el proyecto todavía no tiene
   * ningún pago, no tiene sentido preguntar por su estado acá — se
   * finaliza la sesión y ya. */
  async function handleFinish(session: SessionWithProject) {
    setFinishingId(session.id)
    const result = await updateSessionStatusAction(session.id, 'completed')
    setFinishingId(null)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Sesión finalizada')
    const hasPriorPayment = (balances[session.project_id]?.deposits ?? 0) > 0
    if (hasPriorPayment) setCompletionFor(session.project_id)
    else router.refresh()
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-[1.75rem] bg-card">
        <EmptyState
          icon={CalendarCheck}
          title="Hoy no tienes citas"
          description="Cuando agendes una sesión para hoy, aparecerá aquí."
        />
        <div className="pb-6 text-center">
          <Link
            href="/dashboard?openCalendar=1"
            className="text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver calendario →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <Row
          key={s.id}
          session={s}
          balance={balances[s.project_id]}
          hasMedicalAlert={medicalAlertProjectIds?.has(s.project_id) ?? false}
          onFinish={() => handleFinish(s)}
          finishing={finishingId === s.id}
        />
      ))}

      <Dialog
        open={completionFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCompletionFor(null)
            router.refresh()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesión finalizada</DialogTitle>
            <DialogDescription>
              Este proyecto ya tiene un pago registrado — cuéntanos cómo va antes de seguir.
            </DialogDescription>
          </DialogHeader>
          {completionFor && (
            <ProjectCompletionStep projectId={completionFor} onDone={() => setCompletionFor(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({
  session,
  balance,
  hasMedicalAlert,
  onFinish,
  finishing,
}: {
  session: SessionWithProject
  balance?: ProjectBalance
  hasMedicalAlert?: boolean
  onFinish: () => void
  finishing: boolean
}) {
  const clientName = session.projects?.clients?.name ?? '—'
  const money =
    balance && balance.pending > 0
      ? { label: 'Pendiente', value: balance.pending }
      : balance && balance.deposits > 0
        ? { label: 'Abono', value: balance.deposits }
        : null

  const [hh, rest] = formatTime(session.scheduled_at).split(':')
  const done = session.status === 'completed' || session.status === 'cancelled'

  // Fila al estilo de "Tus juegos" de Apple Games: cuadro grande de color con
  // la hora (en lugar del ícono del juego), nombre en negrita, proyecto y
  // saldo en gris, y la píldora gris "Finalizar" a la derecha.
  return (
    <Link
      href={`/dashboard/projects/${session.project_id}`}
      className="flex items-center gap-3.5 rounded-2xl py-1 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'relative grid size-[4.5rem] shrink-0 place-items-center rounded-[1.25rem] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
          done ? 'tile-gray' : 'tile-gold',
        )}
      >
        <span className="text-center leading-none">
          <span className="block font-title text-[1.375rem] font-bold tabular-nums">{hh}:{rest?.slice(0, 2)}</span>
          <span className="mt-0.5 block text-[11px] font-semibold text-white/75 uppercase">{rest?.slice(2).trim() || 'h'}</span>
        </span>
        {hasMedicalAlert && (
          <span
            title="Condición médica reportada"
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-destructive text-white ring-2 ring-background"
          >
            <AlertTriangle className="size-3" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.1875rem] leading-tight font-semibold">{clientName}</p>
        <p className="truncate text-[15px] text-muted-foreground">
          {money ? (
            <>
              <span className={cn('font-medium tabular-nums', money.label === 'Pendiente' ? 'text-primary' : 'text-foreground/80')}>
                {money.label === 'Pendiente' ? 'Debe' : 'Abonó'} {cop(money.value)}
              </span>{' '}
              · {session.projects?.name ?? 'Sesión'}
            </>
          ) : (
            (session.projects?.name ?? 'Sesión')
          )}
        </p>
      </div>

      {done ? (
        <span className="shrink-0 rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold text-muted-foreground">
          {session.status === 'completed' ? 'Lista' : 'Cancelada'}
        </span>
      ) : (
        <button
          type="button"
          aria-label="Finalizar sesión"
          disabled={finishing}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFinish()
          }}
          className="shrink-0 rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.95] disabled:opacity-50"
        >
          {finishing ? '…' : 'Finalizar'}
        </button>
      )}
    </Link>
  )
}
