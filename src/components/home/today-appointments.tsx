'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, UserRound, CalendarCheck, Play, Square, CheckCircle2, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { cop } from '@/lib/projects/metrics'
import { formatTime } from '@/lib/calendar/utils'
import { endSessionShift } from '@/actions/session-materials'
import { updateSessionStatusAction } from '@/actions/sessions'
import { SessionMaterialsDialog } from '@/components/home/session-materials-dialog'
import { ProjectCompletionStep } from '@/components/home/project-completion-step'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { SessionWithProject } from '@/queries/sessions'
import type { InventoryItem } from '@/queries/inventory'

/** Saldo por proyecto para mostrar en la fila de la cita. */
export type ProjectBalance = { deposits: number; pending: number }

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

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
  enableTimer = false,
  inventoryItems = [],
  activeShifts = {},
  medicalAlertProjectIds,
  consentSignedProjectIds,
}: {
  sessions: SessionWithProject[]
  balances: Record<string, ProjectBalance>
  enableTimer?: boolean
  inventoryItems?: InventoryItem[]
  activeShifts?: Record<string, { id: string; startedAt: string }>
  /** project_id de las citas cuyo cliente reportó una condición médica —
   * pinta el ícono rojo de alerta en la fila (ver `MedicalAlertBanner` en
   * el proyecto para el detalle, privado al tatuador asignado/dueño). */
  medicalAlertProjectIds?: Set<string>
  /** project_id con consentimiento ya firmado — el botón ▶ de la fila no
   * deja avanzar (ni abre el popup de materiales) si el proyecto no está acá. */
  consentSignedProjectIds?: Set<string>
}) {
  const router = useRouter()
  const [overrides, setOverrides] = useState<Record<string, { id: string; startedAt: string } | null>>({})
  const [materialsFor, setMaterialsFor] = useState<string | null>(null)
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
    <div className="space-y-2">
      {sessions.map((s) => (
        <Row
          key={s.id}
          session={s}
          balance={balances[s.project_id]}
          enableTimer={enableTimer}
          hasMedicalAlert={medicalAlertProjectIds?.has(s.project_id) ?? false}
          activeShift={(s.id in overrides ? overrides[s.id] : activeShifts[s.id]) ?? null}
          onStop={(shiftId) => {
            endSessionShift(shiftId)
            setOverrides((m) => ({ ...m, [s.id]: null }))
          }}
          onRequestStart={() => {
            if (consentSignedProjectIds && !consentSignedProjectIds.has(s.project_id)) {
              toast.error('Falta firmar el consentimiento para iniciar esta sesión')
              return
            }
            setMaterialsFor(s.id)
          }}
          onFinish={() => handleFinish(s)}
          finishing={finishingId === s.id}
        />
      ))}

      {enableTimer && (
        <SessionMaterialsDialog
          open={materialsFor !== null}
          onOpenChange={(open) => !open && setMaterialsFor(null)}
          sessionId={materialsFor ?? ''}
          items={inventoryItems}
          onStarted={(shift) => {
            // La acción devuelve `shiftId`; acá el turno se guarda como `id`
            // (mismo shape que `activeShifts` del servidor). Sin este mapeo
            // `activeShift.id` queda undefined y "Detener" no cierra el turno.
            if (materialsFor)
              setOverrides((m) => ({
                ...m,
                [materialsFor]: { id: shift.shiftId, startedAt: shift.startedAt },
              }))
          }}
        />
      )}

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
  enableTimer,
  hasMedicalAlert,
  activeShift,
  onStop,
  onRequestStart,
  onFinish,
  finishing,
}: {
  session: SessionWithProject
  balance?: ProjectBalance
  enableTimer: boolean
  hasMedicalAlert?: boolean
  activeShift: { id: string; startedAt: string } | null
  onStop: (shiftId: string) => void
  onRequestStart: () => void
  onFinish: () => void
  finishing: boolean
}) {
  const clientName = session.projects?.clients?.name ?? '—'
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!activeShift) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeShift])

  const money =
    balance && balance.pending > 0
      ? { label: 'Pendiente', value: balance.pending }
      : balance && balance.deposits > 0
        ? { label: 'Abono', value: balance.deposits }
        : null

  return (
    <Link
      href={`/dashboard/projects/${session.project_id}`}
      className="flex items-center gap-3 rounded-2xl bg-background p-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="w-14 shrink-0 leading-tight">
        <p className="text-sm font-semibold tabular-nums">{formatTime(session.scheduled_at)}</p>
      </div>

      <div
        aria-hidden="true"
        className="relative grid size-10 shrink-0 place-items-center rounded-full bg-card text-muted-foreground"
      >
        <UserRound className="size-5" strokeWidth={1.6} />
        {hasMedicalAlert && (
          <span
            title="Condición médica reportada"
            className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background"
          >
            <AlertTriangle className="size-2.5" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{clientName}</p>
        <p className="truncate text-xs text-muted-foreground">{session.projects?.name ?? 'Sesión'}</p>
      </div>

      {money && (
        <div className="shrink-0 text-right leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {money.label}
          </p>
          <p className="text-sm font-semibold tabular-nums">{cop(money.value)}</p>
        </div>
      )}

      {enableTimer && (
        <button
          type="button"
          data-tour="session-timer"
          aria-label={activeShift ? 'Detener cronómetro' : 'Iniciar sesión'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (activeShift) onStop(activeShift.id)
            else onRequestStart()
          }}
          className={
            activeShift
              ? 'flex shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-primary'
              : 'grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90'
          }
        >
          {activeShift ? (
            <>
              <Square className="size-3.5" strokeWidth={2} fill="currentColor" aria-hidden="true" />
              <span className="font-mono text-xs tabular-nums">
                {formatElapsed(now - new Date(activeShift.startedAt).getTime())}
              </span>
            </>
          ) : (
            <Play className="size-4" strokeWidth={2} fill="currentColor" aria-hidden="true" />
          )}
        </button>
      )}

      {session.status !== 'completed' && session.status !== 'cancelled' && (
        <button
          type="button"
          aria-label="Finalizar sesión"
          disabled={finishing}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFinish()
          }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <CheckCircle2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline">{finishing ? 'Finalizando…' : 'Finalizar'}</span>
        </button>
      )}

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </Link>
  )
}
