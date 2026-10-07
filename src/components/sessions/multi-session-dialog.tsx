'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, Plus, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DurationPicker } from '@/components/sessions/duration-picker'
import { createSessionsBulkAction, getBookingConfirmationLinkAction } from '@/actions/sessions'
import { openWhatsAppTab, redirectWhatsAppTab } from '@/lib/whatsapp-client'

type Row = { scheduled_at: string; duration_minutes: string }

/** Agendar una o varias sesiones de un proyecto de una sola vez (filas que se suman).
 * `initialDurationMinutes`: si el proyecto viene de una cotización con
 * duración por sesión ya elegida (ej. "5h 00m"), cada fila nueva precarga
 * esa duración en vez del default genérico de 60 min. */
export function MultiSessionDialog({
  projectId,
  initialDurationMinutes,
}: {
  projectId: string
  initialDurationMinutes?: number
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const emptyRow = React.useCallback(
    (): Row => ({ scheduled_at: '', duration_minutes: String(initialDurationMinutes ?? 60) }),
    [initialDurationMinutes]
  )
  const [rows, setRows] = React.useState<Row[]>([emptyRow()])
  const [loading, setLoading] = React.useState(false)

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  const addRow = () => setRows((r) => [...r, emptyRow()])
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const valid = rows.filter((r) => r.scheduled_at)
    if (valid.length === 0) {
      toast.error('Agrega al menos una fecha y hora')
      return
    }
    setLoading(true)
    // Igual que en el calendario: se abre YA (síncrono con el submit) para
    // que Safari/iOS no bloquee el popup. Si se agendó más de una sesión a
    // la vez, no hay una sola cita que confirmar -- se cierra sola.
    const waTab = valid.length === 1 ? openWhatsAppTab() : null
    const result = await createSessionsBulkAction(projectId, { sessions: valid })
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      redirectWhatsAppTab(waTab, null)
      return
    }
    toast.success(valid.length > 1 ? 'Sesiones agendadas' : 'Sesión agendada')
    setOpen(false)
    setRows([emptyRow()])
    router.refresh()

    if (waTab && result.data[0]) {
      const linkRes = await getBookingConfirmationLinkAction(result.data[0].id)
      redirectWhatsAppTab(waTab, linkRes.success ? linkRes.data.link : null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="glow-primary h-auto w-full justify-start gap-2.5 rounded-2xl px-4 py-4 text-sm font-semibold">
            <CalendarPlus className="size-4.5" strokeWidth={2} />
            Agendar sesión
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar sesiones</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sesión {i + 1}
                </span>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Quitar sesión"
                    onClick={() => removeRow(i)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`when-${i}`}>Fecha y hora</Label>
                <Input
                  id={`when-${i}`}
                  type="datetime-local"
                  value={row.scheduled_at}
                  onChange={(e) => setRow(i, { scheduled_at: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Duración</Label>
                <DurationPicker
                  value={Number(row.duration_minutes) || 60}
                  onChange={(n) => setRow(i, { duration_minutes: String(n) })}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Agregar otra
          </Button>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Agendando…' : 'Agendar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
