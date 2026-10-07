'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

import { updateProjectSessionsDepositAction } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Editor compacto de número de sesiones y % de abono del proyecto (precargados
 * desde la cotización al convertirla, pero editables después — feedback de Crisbo). */
export function SessionDepositEditor({
  projectId,
  sessionCount,
  depositPercentage,
}: {
  projectId: string
  sessionCount: number | null
  depositPercentage: number | null
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [sessions, setSessions] = React.useState(String(sessionCount ?? ''))
  const [deposit, setDeposit] = React.useState(String(depositPercentage ?? ''))

  async function save() {
    setSaving(true)
    const result = await updateProjectSessionsDepositAction(projectId, {
      session_count: sessions === '' ? undefined : Number(sessions),
      deposit_percentage: deposit === '' ? undefined : Number(deposit),
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Datos actualizados')
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="rounded-lg border bg-background/40 p-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sesiones / Abono
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar sesiones y abono"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mt-1.5 text-sm font-semibold tabular-nums">
          {sessionCount ?? '—'} sesiones · {depositPercentage ?? '—'}% abono
        </p>
      </div>
    )
  }

  return (
    <div className="col-span-2 space-y-2 rounded-lg border bg-background/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="edit-sessions" className="text-[9px] uppercase tracking-[0.2em]">
            Sesiones
          </Label>
          <Input
            id="edit-sessions"
            type="number"
            inputMode="numeric"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-deposit" className="text-[9px] uppercase tracking-[0.2em]">
            Abono (%)
          </Label>
          <Input
            id="edit-deposit"
            type="number"
            inputMode="numeric"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
