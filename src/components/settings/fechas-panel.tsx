'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarOff, Trash2, Plus } from 'lucide-react'

import { blockDayAction, unblockDayAction } from '@/actions/sessions'
import type { BlockedDay } from '@/queries/blocked-days'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/** Formatea 'YYYY-MM-DD' a texto legible es-CO SIN cruzar zonas horarias
 * (se interpreta como fecha local fija, no como instante UTC). */
function formatDay(iso: string): string {
  const parts = iso.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function FechasPanel({ blockedDays }: { blockedDays: BlockedDay[] }) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function block() {
    if (!date) {
      toast.error('Elige una fecha')
      return
    }
    startTransition(async () => {
      const result = await blockDayAction({ date, reason: reason || undefined })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Día bloqueado')
      setDate('')
      setReason('')
      router.refresh()
    })
  }

  function unblock(day: string) {
    startTransition(async () => {
      const result = await unblockDayAction(day)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Día desbloqueado')
      router.refresh()
    })
  }

  const sorted = [...blockedDays].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <SettingsSubpage title="Fechas especiales" description="Días que no trabajas: festivos, viajes, eventos.">
      <div className="space-y-6">
        {/* Agregar un día */}
        <div className="space-y-3 rounded-2xl bg-card p-4">
          <div className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">Bloquear un día</div>
          <div className="space-y-1.5">
            <label htmlFor="block-date" className="block text-xs text-muted-foreground">
              Fecha
            </label>
            <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="block-reason" className="block text-xs text-muted-foreground">
              Motivo (opcional)
            </label>
            <Input id="block-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Viaje, festivo…" maxLength={120} />
          </div>
          <Button type="button" onClick={block} disabled={pending || !date} className="h-10 gap-2">
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Bloquear día
          </Button>
        </div>

        {/* Lista de bloqueados */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <CalendarOff className="size-7 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No tienes días bloqueados.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((day) => (
              <li key={day.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5">
                <CalendarOff className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{formatDay(day.date)}</p>
                  {day.reason && <p className="truncate text-xs text-muted-foreground">{day.reason}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => unblock(day.date)}
                  disabled={pending}
                  aria-label={`Desbloquear ${formatDay(day.date)}`}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsSubpage>
  )
}
