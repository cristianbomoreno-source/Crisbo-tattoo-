'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DollarSign, Percent, Info } from 'lucide-react'

import { updateStudioDeposit } from '@/actions/studio'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { cn } from '@/lib/utils'

type Mode = 'fixed' | 'percent' | ''
type Props = { depositMode: Mode; depositValue: number | undefined }

export function AbonoForm({ depositMode: initialMode, depositValue: initialValue }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [value, setValue] = useState<number | undefined>(initialValue)
  const [pending, startTransition] = useTransition()

  const dirty = mode !== initialMode || value !== initialValue
  const missingValue = !!mode && !(value !== undefined && value > 0)

  function pickMode(next: 'fixed' | 'percent') {
    if (next === mode) return
    setMode(next)
    setValue(undefined)
  }

  const display = value === undefined ? '' : mode === 'percent' ? String(value) : Math.round(value).toLocaleString('es-CO')

  function onChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits === '') {
      setValue(undefined)
      return
    }
    const num = Number(digits)
    setValue(mode === 'percent' ? Math.min(100, num) : num)
  }

  function save() {
    if (missingValue) {
      toast.error('Ingresa el monto del abono')
      return
    }
    startTransition(async () => {
      const result = await updateStudioDeposit({
        depositMode: mode || undefined,
        depositValue: value,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Abono actualizado')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage title="Abono para reservar" description="El abono que se aplica a tus cotizaciones nuevas.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { m: 'fixed' as const, icon: DollarSign, title: 'Monto fijo', sub: 'Un valor en pesos' },
            { m: 'percent' as const, icon: Percent, title: 'Porcentaje', sub: '% del precio del tatuaje' },
          ]).map(({ m, icon: Icon, title, sub }) => {
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => pickMode(m)}
                aria-pressed={active}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <Icon className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.8} aria-hidden="true" />
                <span className={cn('font-display text-xs font-semibold uppercase tracking-wide', active ? 'text-primary' : 'text-foreground')}>
                  {title}
                </span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </button>
            )
          })}
        </div>

        {mode && (
          <div>
            <label htmlFor="abono-value" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
              Monto del abono
            </label>
            <div className="relative">
              {mode === 'fixed' && (
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
              )}
              <input
                id="abono-value"
                inputMode="numeric"
                value={display}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
                className={cn(
                  'h-11 w-full rounded-md border border-input bg-transparent py-2 text-right font-title text-lg tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'fixed' ? 'pl-8 pr-16' : 'pl-3 pr-10'
                )}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-display text-xs font-semibold uppercase text-muted-foreground">
                {mode === 'fixed' ? 'COP' : '%'}
              </span>
            </div>
            {missingValue && <p className="mt-1.5 text-xs text-warning">Ingresa un monto mayor a 0.</p>}
          </div>
        )}

        <p className="flex items-start gap-2 rounded-2xl bg-card/40 p-3.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Se aplica automáticamente a tus cotizaciones nuevas.
        </p>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
