'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, CheckCircle2 } from 'lucide-react'

import { updateProjectProgressAction } from '@/actions/projects'
import { Button } from '@/components/ui/button'

/**
 * Tarjeta "Progreso del proyecto" de la página de detalle, ahora editable —
 * mismo patrón lápiz → editar → guardar de `ProjectValueEditor`. Al editar,
 * un slider nativo (0–100, pasos de 5) mueve la barra en vivo. Guardar
 * escribe `manual_progress`; "Automático" lo borra (null) y el porcentaje
 * vuelve a calcularse por sesiones completadas, la lógica de siempre
 * (`manual_progress ?? sessionPct`).
 */
export function ProjectProgressEditor({
  projectId,
  pct,
  manualProgress,
}: {
  projectId: string
  /** Porcentaje efectivo actual (manual si existe, si no el de sesiones). */
  pct: number
  manualProgress: number | null
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [value, setValue] = React.useState(pct)

  const shownPct = editing ? value : pct
  const complete = shownPct >= 100

  async function save(percent: number | null) {
    setSaving(true)
    const result = await updateProjectProgressAction(projectId, percent)
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(percent === null ? 'Progreso automático' : 'Progreso actualizado')
    setEditing(false)
    router.refresh()
  }

  return (
    <section className="flex items-center gap-3.5 rounded-[1.75rem] bg-card p-4 sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        {complete ? <CheckCircle2 className="size-5.5" strokeWidth={2} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-title text-2xl leading-none tabular-nums">{shownPct}%</p>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setValue(pct)
                setEditing(true)
              }}
              aria-label="Editar progreso del proyecto"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-4" strokeWidth={1.8} />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          {complete ? 'Proyecto completado' : 'Progreso del proyecto'}
          {!editing && manualProgress !== null && (
            <span className="ml-1.5 normal-case tracking-normal text-muted-foreground/70">
              · manual
            </span>
          )}
        </p>

        {editing ? (
          <div className="mt-2 space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              aria-label="Progreso del proyecto"
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-end gap-2">
              {manualProgress !== null && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => save(null)}
                  className="text-muted-foreground"
                >
                  Automático
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={saving} onClick={() => save(value)}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
            <div className="h-full rounded-full bg-primary" style={{ width: `${shownPct}%` }} />
          </div>
        )}
      </div>
    </section>
  )
}
