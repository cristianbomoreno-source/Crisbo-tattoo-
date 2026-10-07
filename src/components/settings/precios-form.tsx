'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

import { updatePricePresetsAction, updateSlotIntervalAction } from '@/actions/studio'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { cop } from '@/lib/projects/metrics'
import { cn } from '@/lib/utils'

type Preset = { label: string; amount: number }

const INTERVALS = [15, 30, 60] as const

/**
 * Ajustes → Precios preestablecidos: lista libre de "atajo de precio" (ej.
 * "Minimalista" $160.000, "Antebrazo" $900.000...) que cada tatuador arma a
 * su gusto. Se usan en la Cotización rápida: tocas los que apliquen y se
 * suman solos al precio. También vive acá el intervalo de horas del
 * calendario (cada cuánto se dividen las franjas al agendar).
 */
export function PreciosForm({
  presets: initial,
  slotIntervalMinutes,
}: {
  presets: Preset[]
  slotIntervalMinutes: number
}) {
  const router = useRouter()
  const [presets, setPresets] = useState<Preset[]>(initial)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState(slotIntervalMinutes)
  const [pending, startTransition] = useTransition()
  const [savingInterval, setSavingInterval] = useState(false)

  const dirty = JSON.stringify(presets) !== JSON.stringify(initial)

  async function pickInterval(n: number) {
    setInterval(n)
    setSavingInterval(true)
    const result = await updateSlotIntervalAction({ minutes: n })
    setSavingInterval(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Intervalo actualizado')
    router.refresh()
  }

  function addPreset() {
    const amountNum = Number(amount.replace(/\D/g, ''))
    if (!label.trim() || !amountNum) {
      toast.error('Ponle un nombre y un precio')
      return
    }
    setPresets((p) => [...p, { label: label.trim(), amount: amountNum }])
    setLabel('')
    setAmount('')
  }

  function removePreset(i: number) {
    setPresets((p) => p.filter((_, idx) => idx !== i))
  }

  function save() {
    startTransition(async () => {
      const result = await updatePricePresetsAction({ presets })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Precios actualizados')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage
      title="Precios preestablecidos"
      description="Atajos de precio para la cotización rápida. Se suman al tocarlos."
    >
      <div className="space-y-6">
        <div className="space-y-2 border-b border-border pb-6">
          <h2 className="text-sm font-medium">Intervalo de horas del calendario</h2>
          <p className="text-xs text-muted-foreground">
            Cada cuánto se dividen las franjas al agendar una cita.
          </p>
          <div className="flex gap-2 pt-1">
            {INTERVALS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={savingInterval}
                onClick={() => pickInterval(n)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                  interval === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {n} min
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {presets.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no agregas ninguno.</p>
          )}
          {presets.map((p, i) => (
            <div
              key={`${p.label}-${i}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.label}</p>
                <p className="text-sm text-muted-foreground">{cop(p.amount)}</p>
              </div>
              <button
                type="button"
                onClick={() => removePreset(i)}
                aria-label={`Quitar ${p.label}`}
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 border-t border-border pt-5">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="preset-label" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nombre
            </label>
            <Input
              id="preset-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Antebrazo"
            />
          </div>
          <div className="w-32 space-y-1.5">
            <label htmlFor="preset-amount" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Precio
            </label>
            <Input
              id="preset-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="900000"
            />
          </div>
          <button
            type="button"
            onClick={addPreset}
            aria-label="Agregar precio"
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
