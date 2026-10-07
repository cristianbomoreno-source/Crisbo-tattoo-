'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Info } from 'lucide-react'

import { updateStudioPolicies } from '@/actions/studio'
import { PAYMENT_POLICIES, CANCELLATION_POLICIES, STUDIO_RULES } from '@/components/onboarding/constants'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { cn } from '@/lib/utils'

const OTHER_RULE = STUDIO_RULES[STUDIO_RULES.length - 1]!
const FIXED_RULES = STUDIO_RULES.filter((r) => r.value !== OTHER_RULE.value)

type Props = {
  paymentPolicy: string
  cancellationPolicy: string
  rules: string[]
}

export function PoliticasForm({ paymentPolicy: iPay, cancellationPolicy: iCancel, rules: iRules }: Props) {
  const router = useRouter()
  const [paymentPolicy, setPaymentPolicy] = useState(iPay)
  const [cancellationPolicy, setCancellationPolicy] = useState(iCancel)
  const [rules, setRules] = useState<string[]>(iRules)
  const [pending, startTransition] = useTransition()

  const customRule = rules.find((r) => !FIXED_RULES.some((fr) => fr.value === r))
  const otherActive = customRule !== undefined

  const dirty =
    paymentPolicy !== iPay ||
    cancellationPolicy !== iCancel ||
    JSON.stringify([...rules].sort()) !== JSON.stringify([...iRules].sort())

  function toggleFixed(value: string) {
    setRules((r) => (r.includes(value) ? r.filter((x) => x !== value) : [...r, value]))
  }
  function toggleOther() {
    setRules((r) => (otherActive ? r.filter((x) => FIXED_RULES.some((fr) => fr.value === x)) : [...r, '']))
  }
  function onCustomChange(text: string) {
    setRules((r) => r.map((x) => (FIXED_RULES.some((fr) => fr.value === x) ? x : text)))
  }

  function save() {
    startTransition(async () => {
      const result = await updateStudioPolicies({
        paymentPolicy: paymentPolicy || undefined,
        cancellationPolicy: cancellationPolicy || undefined,
        rules: rules.map((r) => r.trim()).filter((r) => r.length > 0),
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Políticas actualizadas')
      router.refresh()
    })
  }

  const selectClass =
    'w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <SettingsSubpage title="Políticas del estudio" description="Pago, cancelación y reglas — salen en el PDF de tus cotizaciones.">
      <div className="space-y-6">
        <div>
          <label htmlFor="pol-pago" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
            Política de pago
          </label>
          <select id="pol-pago" value={paymentPolicy} onChange={(e) => setPaymentPolicy(e.target.value)} className={selectClass}>
            <option value="">Sin definir</option>
            {PAYMENT_POLICIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pol-cancel" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
            Política de cancelación
          </label>
          <select id="pol-cancel" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} className={selectClass}>
            <option value="">Sin definir</option>
            {CANCELLATION_POLICIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-foreground">Reglas del estudio</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {FIXED_RULES.map((rule) => {
              const active = rules.includes(rule.value)
              const Icon = rule.icon
              return (
                <button
                  key={rule.value}
                  type="button"
                  onClick={() => toggleFixed(rule.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                    <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={cn('flex-1 font-display text-xs font-semibold uppercase tracking-wide', active ? 'text-primary' : 'text-foreground')}>
                    {rule.label}
                  </span>
                  {active && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />}
                </button>
              )
            })}
            <button
              type="button"
              onClick={toggleOther}
              aria-pressed={otherActive}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                otherActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}
            >
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', otherActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                <OTHER_RULE.icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={cn('flex-1 font-display text-xs font-semibold uppercase tracking-wide', otherActive ? 'text-primary' : 'text-foreground')}>
                {OTHER_RULE.label}
              </span>
              {otherActive && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />}
            </button>
          </div>
          {otherActive && (
            <div className="mt-2.5">
              <label htmlFor="pol-custom" className="sr-only">
                Otra regla
              </label>
              <input
                id="pol-custom"
                type="text"
                value={customRule ?? ''}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder="Ej. No se admiten menores sin acompañante"
                maxLength={120}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 rounded-2xl bg-card/40 p-3.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Aparecen en el PDF de tus cotizaciones.
        </p>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
