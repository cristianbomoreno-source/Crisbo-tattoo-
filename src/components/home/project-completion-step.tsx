'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadGalleryItemAction } from '@/actions/gallery'
import { updateProjectStatusAction, updateProjectProgressAction } from '@/actions/projects'

type Step = 'ask' | 'photo' | 'percent'

/**
 * Paso "¿cómo va el proyecto?" — se muestra cuando el proyecto YA tiene un
 * pago registrado (única condición que lo dispara, en los dos lugares que
 * lo usan: `CajaDialog` justo después de registrar un cobro, y
 * el botón "Finalizar sesión" de `TodayAppointments` cuando el proyecto de
 * esa sesión ya tenía algún pago de antes). Dos caminos:
 * - "Completado": pide la foto del resultado final antes de marcarlo (no se
 *   deja completar un proyecto sin foto).
 * - "Definir % de avance": barra deslizante 0–100 (antes era un campo de
 *   texto numérico — se cambió por pedido explícito de usar "una barra para
 *   seleccionar", igual que el slider de `ProjectProgressEditor`).
 * Extraído a componente propio (antes vivía inline y sin exportar dentro de
 * `register-day-payments-dialog.tsx` original) para no duplicar esta lógica.
 */
export function ProjectCompletionStep({
  projectId,
  onDone,
  initialPercent = 50,
}: {
  projectId: string
  onDone: () => void
  /** Valor inicial de la barra al entrar al paso "Definir % de avance". */
  initialPercent?: number
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('ask')
  const [percent, setPercent] = useState(initialPercent)
  const [saving, setSaving] = useState(false)

  async function finishCompleted() {
    setSaving(true)
    const [statusRes] = await Promise.all([
      updateProjectStatusAction(projectId, 'completed'),
      updateProjectProgressAction(projectId, 100),
    ])
    setSaving(false)
    if (!statusRes.success) {
      toast.error(statusRes.error.message)
      return
    }
    toast.success('Proyecto marcado como completado')
    router.refresh()
    onDone()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    const fd = new FormData()
    fd.set('project_id', projectId)
    fd.set('type', 'final')
    fd.set('file', file)
    const result = await uploadGalleryItemAction(fd)
    if (!result.success) {
      setSaving(false)
      toast.error(result.error.message)
      return
    }
    await finishCompleted()
  }

  async function savePercent() {
    setSaving(true)
    const result = await updateProjectProgressAction(projectId, percent)
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Avance actualizado')
    router.refresh()
    onDone()
  }

  if (step === 'photo') {
    return (
      <div className="space-y-2 rounded-xl bg-card p-3">
        <p className="text-xs text-muted-foreground">Sube la foto del resultado final:</p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40">
          <ImagePlus className="size-4" strokeWidth={1.8} />
          {saving ? 'Subiendo…' : 'Elegir foto'}
          <input type="file" accept="image/*" className="sr-only" disabled={saving} onChange={handlePhoto} />
        </label>
      </div>
    )
  }

  if (step === 'percent') {
    return (
      <div className="space-y-3 rounded-xl bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Avance del proyecto</span>
          <span className="font-title text-lg tabular-nums text-primary">{percent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          aria-label="Porcentaje de avance del proyecto"
          className="w-full accent-primary"
        />
        <Button type="button" size="sm" className="w-full" onClick={savePercent} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar avance'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl bg-card p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <CheckCircle2 className="size-3.5" strokeWidth={2} />
        Pago registrado — ¿el proyecto quedó completado?
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={() => setStep('photo')}>
          Sí, completado
        </Button>
        <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => setStep('percent')}>
          Definir % de avance
        </Button>
      </div>
      <button type="button" onClick={onDone} className="w-full text-center text-xs text-muted-foreground">
        Omitir por ahora
      </button>
    </div>
  )
}
