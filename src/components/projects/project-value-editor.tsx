'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

import { updateProjectValueAction } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cop } from '@/lib/projects/metrics'

/** Editor compacto del valor total del proyecto (precargado desde la
 * cotización al convertirla, pero editable después — mismo patrón que
 * `SessionDepositEditor`). */
export function ProjectValueEditor({
  projectId,
  totalValue,
}: {
  projectId: string
  totalValue: number | null
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [value, setValue] = React.useState(String(totalValue ?? ''))

  async function save() {
    if (value === '') {
      toast.error('Ponle un valor al proyecto')
      return
    }
    setSaving(true)
    const result = await updateProjectValueAction(projectId, { total_value: Number(value) })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Valor actualizado')
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="rounded-lg border bg-background/40 p-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Valor del proyecto
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar valor del proyecto"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mt-1.5 text-sm font-semibold tabular-nums">{cop(totalValue ?? 0)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border bg-background/40 p-3">
      <div className="space-y-1">
        <Label htmlFor="edit-total-value" className="text-[9px] uppercase tracking-[0.2em]">
          Valor total
        </Label>
        <Input
          id="edit-total-value"
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
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
