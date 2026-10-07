'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'

import { PAYMENT_METHOD_OPTIONS } from '@/lib/validations/studio'
import { updateStudioPaymentMethods as saveMethods } from '@/actions/studio'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PagosForm({ initialMethods }: { initialMethods: string[] }) {
  const router = useRouter()
  const [methods, setMethods] = useState<string[]>(initialMethods)
  const [custom, setCustom] = useState('')
  const [pending, startTransition] = useTransition()

  const dirty = JSON.stringify([...methods].sort()) !== JSON.stringify([...initialMethods].sort())
  const suggested = PAYMENT_METHOD_OPTIONS as readonly string[]
  const customMethods = methods.filter((m) => !suggested.includes(m))

  function toggle(method: string) {
    setMethods((m) => (m.includes(method) ? m.filter((x) => x !== method) : [...m, method]))
  }

  function addCustom() {
    const v = custom.trim()
    if (!v) return
    if (methods.includes(v)) {
      setCustom('')
      return
    }
    setMethods((m) => [...m, v])
    setCustom('')
  }

  function save() {
    startTransition(async () => {
      const result = await saveMethods({ methods })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Métodos de pago actualizados')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage title="Métodos de pago" description="Cómo te pueden pagar tus clientes. Salen en el PDF de la cotización.">
      <div className="space-y-6">
        <div className="flex flex-col gap-2.5">
          {suggested.map((method) => {
            const active = methods.includes(method)
            return (
              <button
                key={method}
                type="button"
                onClick={() => toggle(method)}
                aria-pressed={active}
                className={cn(
                  'flex items-center justify-between rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <span className={cn('font-display text-sm font-semibold uppercase tracking-wide', active ? 'text-primary' : 'text-foreground')}>
                  {method}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                  )}
                >
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>

        {/* Métodos personalizados ya agregados */}
        {customMethods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customMethods.map((m) => (
              <span key={m} className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 py-1 pl-3 pr-1.5 text-sm text-foreground">
                {m}
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  aria-label={`Quitar ${m}`}
                  className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Agregar método personalizado */}
        <div className="space-y-1.5">
          <label htmlFor="custom-method" className="block font-display text-xs font-medium uppercase tracking-wide text-foreground">
            Agregar otro método
          </label>
          <div className="flex gap-2">
            <Input
              id="custom-method"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
              placeholder="Ej. Bold, PayPal…"
              maxLength={40}
            />
            <Button type="button" variant="outline" size="icon" onClick={addCustom} aria-label="Agregar método">
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
