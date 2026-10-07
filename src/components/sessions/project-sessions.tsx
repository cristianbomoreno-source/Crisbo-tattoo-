'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { RescheduleSessionDialog } from '@/components/sessions/reschedule-session'
import {
  updateSessionStatusAction,
  deleteSessionAction,
} from '@/actions/sessions'
import { dayKey, dayLabel, formatTime } from '@/lib/calendar/utils'
import { sessionPaid, cop } from '@/lib/projects/metrics'
import { RegisterPaymentDialog } from '@/components/payments/register-payment-dialog'

type S = {
  id: string
  status: string
  scheduled_at: string
  duration_minutes: number
}

function SessionItem({ projectId, s, paid }: { projectId: string; s: S; paid: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const completed = s.status === 'completed'

  async function toggleComplete() {
    setBusy(true)
    const result = await updateSessionStatusAction(
      s.id,
      completed ? 'scheduled' : 'completed'
    )
    setBusy(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(completed ? 'Sesión reabierta' : 'Sesión completada')
    router.refresh()
  }

  async function remove() {
    setBusy(true)
    const result = await deleteSessionAction(s.id)
    if (!result.success) {
      setBusy(false)
      toast.error(result.error.message)
      return
    }
    toast.success('Sesión eliminada')
    router.refresh()
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium capitalize">{dayLabel(dayKey(s.scheduled_at))}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatTime(s.scheduled_at)} · {s.duration_minutes} min
        </p>
        <StatusBadge status={s.status} />
        {paid > 0 && (
          <p className="text-xs font-medium tabular-nums text-success">Abono: {cop(paid)}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={completed ? 'ghost' : 'outline'}
          size="sm"
          onClick={toggleComplete}
          disabled={busy}
        >
          <CheckCircle2 className="size-4" />
          {completed ? 'Reabrir' : 'Completar'}
        </Button>
        <RescheduleSessionDialog
          sessionId={s.id}
          scheduledAt={s.scheduled_at}
          durationMinutes={s.duration_minutes}
          projectId={projectId}
        />
        <RegisterPaymentDialog
          projectId={projectId}
          balance={0}
          sessionId={s.id}
          triggerLabel="Abonar"
        />
        {confirming ? (
          <span className="flex items-center gap-1">
            <Button variant="destructive" size="sm" onClick={remove} disabled={busy}>
              Eliminar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
              No
            </Button>
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            aria-label="Eliminar sesión"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </li>
  )
}

/** Lista de sesiones de un proyecto con acciones (completar, reagendar, eliminar). */
export function ProjectSessions({
  projectId,
  sessions,
  payments,
}: {
  projectId: string
  sessions: S[]
  payments: { amount: number; session_id: string | null }[]
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay sesiones agendadas.</p>
  }
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )
  return (
    <ul className="space-y-2">
      {sorted.map((s) => (
        <SessionItem key={s.id} projectId={projectId} s={s} paid={sessionPaid(payments, s.id)} />
      ))}
    </ul>
  )
}
