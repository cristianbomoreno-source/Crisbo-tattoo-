'use client'

import * as React from 'react'
import { PiggyBank, Banknote, PenLine, DollarSign, Percent, Check, Info, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cop } from '@/lib/projects/metrics'
import { DEPOSIT_SUGGESTED_FIXED, DEPOSIT_SUGGESTED_PCT } from '@/components/onboarding/constants'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Mini-encabezado de sub-sección (mismo patrón duplicado que step-studio.tsx / step-experience.tsx). */
function MiniHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide">{label}</h3>
    </div>
  )
}

/** Check rojo en esquina superior derecha (mismo patrón que step-experience.tsx). */
function CornerCheck() {
  return (
    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/** Toggle de modo (Monto fijo | Porcentaje) — card con radio dot, no checkbox
 * (brief §6: "(radio dot)", a diferencia de las cards de check de otros pasos). */
function ModeToggleCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  subtitle: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      <span className="flex items-center justify-between">
        <Icon className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.8} />
        <span
          aria-hidden="true"
          className={cn(
            'flex size-4 items-center justify-center rounded-full border-2',
            active ? 'border-primary' : 'border-muted-foreground/40'
          )}
        >
          {active && <span className="size-2 rounded-full bg-primary" />}
        </span>
      </span>
      <span
        className={cn(
          'font-display text-xs font-semibold uppercase tracking-wide',
          active ? 'text-primary' : 'text-foreground'
        )}
      >
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  )
}

/** Card de monto sugerido: valor formateado + check rojo cuando coincide con
 * `draft.depositValue`, y una insignia opcional (usada en 20% de abono). */
function SuggestedCard({
  active,
  label,
  badge,
  onClick,
}: {
  active: boolean
  label: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border bg-card px-2 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      {active && <CornerCheck />}
      <span className={cn('font-title text-base tabular-nums', active ? 'text-primary' : 'text-foreground')}>
        {label}
      </span>
      {badge && (
        <span className="font-display text-[0.55rem] font-bold uppercase tracking-wide text-primary">{badge}</span>
      )}
    </button>
  )
}

/**
 * Paso 6 — Abono para reservar (opcional, spec §6). Modo (fijo/porcentaje) →
 * sugeridos (4 cards según modo, `DEPOSIT_SUGGESTED_FIXED`/`_PCT`) → monto
 * personalizado → nota → VISTA PREVIA. `draft.depositMode`/`depositValue`
 * alimentan `depositStepSchema` (lib/validations/onboarding.ts), que exige
 * `depositValue` cuando hay `depositMode` — `canContinue('deposit', …)` en
 * onboarding-wizard.tsx refleja esa misma regla para deshabilitar CONTINUAR.
 *
 * Sugeridos y monto personalizado solo se muestran una vez elegido el modo:
 * antes de eso no hay unidad (COP vs %) que darle al input, así que mostrarlo
 * produciría un campo ambiguo — mejor pedir el modo primero (mismo criterio
 * que el resto de pasos: nunca un control sin contexto para interpretarlo).
 */
export function StepDeposit({ draft, patch }: OnboardingStepProps) {
  const mode = draft.depositMode

  function setMode(next: 'fixed' | 'percent') {
    if (next === mode) return
    // Reset del monto al cambiar de modo: un valor en pesos (ej. 50000) no es
    // un porcentaje válido y viceversa — dejarlo pisado confundiría la card
    // "seleccionada" y la vista previa con una unidad que ya no aplica.
    patch({ depositMode: next, depositValue: undefined })
  }

  function pickSuggested(value: number) {
    patch({ depositValue: value })
  }

  const customDisplay =
    draft.depositValue === undefined
      ? ''
      : mode === 'percent'
        ? String(draft.depositValue)
        : Math.round(draft.depositValue).toLocaleString('es-CO')

  function onCustomChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits === '') {
      patch({ depositValue: undefined })
      return
    }
    const num = Number(digits)
    patch({ depositValue: mode === 'percent' ? Math.min(100, num) : num })
  }

  // Sin monto O monto 0: el schema exige `.positive()`, así que 0 también
  // bloquea CONTINUAR (misma regla que `canContinue('deposit')` en el wizard)
  // y muestra el hint — no solo el campo vacío.
  const missingValue = !!mode && !(draft.depositValue !== undefined && draft.depositValue > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Modo → draft.depositMode */}
      <section>
        <MiniHeader icon={PiggyBank} label="¿Cuál será tu abono para reservar?" />
        <div className="grid grid-cols-2 gap-2.5">
          <ModeToggleCard
            icon={DollarSign}
            title="Monto fijo"
            subtitle="Un valor en pesos"
            active={mode === 'fixed'}
            onClick={() => setMode('fixed')}
          />
          <ModeToggleCard
            icon={Percent}
            title="Porcentaje del valor"
            subtitle="% del precio del tatuaje"
            active={mode === 'percent'}
            onClick={() => setMode('percent')}
          />
        </div>
      </section>

      {mode ? (
        <>
          {/* Sugeridos → draft.depositValue */}
          <section>
            <MiniHeader icon={Banknote} label="Selecciona un monto sugerido" />
            <div className="grid grid-cols-2 gap-2.5">
              {mode === 'fixed'
                ? DEPOSIT_SUGGESTED_FIXED.map((value) => (
                    <SuggestedCard
                      key={value}
                      active={draft.depositValue === value}
                      label={`${cop(value)} COP`}
                      onClick={() => pickSuggested(value)}
                    />
                  ))
                : DEPOSIT_SUGGESTED_PCT.map((value) => (
                    <SuggestedCard
                      key={value}
                      active={draft.depositValue === value}
                      label={`${value}%`}
                      badge={value === 20 ? 'Recomendado' : undefined}
                      onClick={() => pickSuggested(value)}
                    />
                  ))}
            </div>
          </section>

          {/* Monto personalizado → draft.depositValue */}
          <section>
            <MiniHeader icon={PenLine} label="O define un monto personalizado" />
            <div className="relative">
              {mode === 'fixed' && (
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-sm font-semibold text-muted-foreground">
                  $
                </span>
              )}
              <label htmlFor="deposit-custom" className="sr-only">
                Monto personalizado del abono
              </label>
              <input
                id="deposit-custom"
                inputMode="numeric"
                value={customDisplay}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder="0"
                className={cn(
                  'h-12 w-full rounded-xl border border-border bg-card/60 py-3 text-right font-title text-lg tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'fixed' ? 'pl-8 pr-16' : 'pl-4 pr-10'
                )}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {mode === 'fixed' ? 'COP' : '%'}
              </span>
            </div>
            {missingValue && (
              <p className="mt-1.5 text-xs text-warning">Ingresa un monto para continuar</p>
            )}
          </section>
        </>
      ) : null}

      {/* Nota */}
      <div className="flex items-start gap-3 rounded-2xl bg-card/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Este abono se mostrará automáticamente en tus cotizaciones y reservas. Podrás cambiarlo cuando lo necesites.
        </p>
      </div>

      {/* VISTA PREVIA — solo si hay un monto real (nunca datos inventados) */}
      {mode && draft.depositValue !== undefined && (
        <div className="rounded-2xl border-primary bg-card p-4">
          <span className="mb-3 block font-display text-xs font-semibold uppercase tracking-wide text-primary">
            Vista previa
          </span>
          <div className="flex items-start gap-3 rounded-2xl border-dashed bg-card/40 p-3.5">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Se mostrará en tus cotizaciones así:</p>
              <p className="mt-2 font-display text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Abono para reservar
              </p>
              <p className="mt-0.5 font-title text-2xl tabular-nums text-foreground">
                {mode === 'fixed' ? `${cop(draft.depositValue)} COP` : `${draft.depositValue}% del valor`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
