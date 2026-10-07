'use client'

import * as React from 'react'
import { CircleDollarSign, Clock3, ShieldCheck, Sparkles, Info, Check, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAYMENT_POLICIES, CANCELLATION_POLICIES, STUDIO_RULES } from '@/components/onboarding/constants'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Mini-encabezado de sub-sección (mismo patrón duplicado que step-studio.tsx / step-deposit.tsx). */
function MiniHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide">{label}</h3>
    </div>
  )
}

/** Check rojo en esquina superior derecha (mismo patrón que step-experience.tsx / step-deposit.tsx). */
function CornerCheck() {
  return (
    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/** Card de política de pago (4, grid-cols-2 sm:grid-cols-4): icono centrado +
 * check en la esquina cuando está seleccionada (mismo patrón que STUDIO_TYPES
 * en step-studio.tsx), con subtítulo debajo del título. */
function PaymentPolicyCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: LucideIcon
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
        'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-card px-2 py-3.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      {active && <CornerCheck />}
      <Icon className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.7} aria-hidden="true" />
      <span
        className={cn(
          'line-clamp-2 font-display text-[clamp(0.55rem,2.2vw,0.62rem)] font-semibold uppercase leading-tight tracking-wide',
          active ? 'text-primary' : 'text-foreground'
        )}
      >
        {title}
      </span>
      <span className="line-clamp-2 text-[0.62rem] leading-tight text-muted-foreground">{subtitle}</span>
    </button>
  )
}

/** Radio card apilada de política de cancelación: dot rojo a la izquierda +
 * título/subtítulo (mismo patrón que `ModeToggleCard` de step-deposit.tsx,
 * pero en fila full-width en vez de grid 2 cols). */
function CancellationRow({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string
  subtitle: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
          active ? 'border-primary' : 'border-muted-foreground/40'
        )}
      >
        {active && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'font-display text-sm font-semibold uppercase tracking-wide',
            active ? 'text-primary' : 'text-foreground'
          )}
        >
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  )
}

/** Switch moderno para una regla del estudio (spec: "sustituye las tarjetas
 * largas por switches modernos") — icono + título/subtítulo a la izquierda,
 * interruptor real a la derecha. Misma semántica que `RuleToggle` de antes
 * (mismo `draft.rules`), solo cambia la presentación. */
function RuleSwitchRow({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-3.5 py-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={title}
        onClick={onClick}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          active ? 'bg-primary' : 'bg-muted-foreground/25'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white transition-transform duration-200',
            active ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

// 'Otras reglas' es la última entrada de STUDIO_RULES (constants.ts) — se
// trata distinto al resto: no se guarda su valor literal en `draft.rules`,
// sino el texto libre que el usuario escriba (ver `toggleOtherRule` abajo).
const OTHER_RULE = STUDIO_RULES[STUDIO_RULES.length - 1]!
const FIXED_RULES = STUDIO_RULES.filter((r) => r.value !== OTHER_RULE.value)

/**
 * Paso 7 — Políticas y condiciones (opcional, spec §7). Política de pago (4
 * cards) → `draft.paymentPolicy` (nota de abono no reembolsable SOLO si
 * eligió "Abono obligatorio") · política de cancelación (3 radios apiladas)
 * → `draft.cancellationPolicy` · reglas del estudio (6 toggles, grid 2 cols)
 * → `draft.rules`.
 *
 * "Otras reglas" (brief): al activarse abre un input de texto libre. Como
 * `OnboardingDraft` no tiene un campo separado para el texto custom (a
 * diferencia de `otherStyle` en el paso 2), el texto se guarda DIRECTO como
 * un elemento más de `draft.rules` — cualquier entrada que no calce con
 * `FIXED_RULES` se interpreta como la regla custom (a lo sumo una a la vez,
 * por construcción de `toggleOtherRule`/`onCustomRuleChange`). Puede quedar
 * como cadena vacía mientras el usuario no ha escrito nada todavía (el
 * toggle ya está "activo" para mostrar el input) — `saveStep('policies', …)`
 * en onboarding-wizard.tsx filtra las entradas vacías antes de guardar, para
 * cumplir `policiesStepSchema` (`z.string().min(1)`).
 */
export function StepPolicies({ draft, patch }: OnboardingStepProps) {
  const customRule = draft.rules.find((r) => !FIXED_RULES.some((fr) => fr.value === r))
  const otherActive = customRule !== undefined

  function toggleFixedRule(value: string) {
    const active = draft.rules.includes(value)
    patch({ rules: active ? draft.rules.filter((r) => r !== value) : [...draft.rules, value] })
  }

  function toggleOtherRule() {
    if (otherActive) {
      patch({ rules: draft.rules.filter((r) => FIXED_RULES.some((fr) => fr.value === r)) })
    } else {
      patch({ rules: [...draft.rules, ''] })
    }
  }

  function onCustomRuleChange(text: string) {
    patch({ rules: draft.rules.map((r) => (FIXED_RULES.some((fr) => fr.value === r) ? r : text)) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Política de pago → draft.paymentPolicy */}
      <section>
        <MiniHeader icon={CircleDollarSign} label="Política de pago" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PAYMENT_POLICIES.map((policy) => (
            <PaymentPolicyCard
              key={policy.value}
              icon={policy.icon}
              title={policy.label}
              subtitle={policy.subtitle}
              active={draft.paymentPolicy === policy.value}
              onClick={() => patch({ paymentPolicy: policy.value })}
            />
          ))}
        </div>

        {draft.paymentPolicy === 'Abono obligatorio' && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-card/40 p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-xs text-muted-foreground">El abono no es reembolsable en caso de cancelación.</p>
          </div>
        )}
      </section>

      {/* Política de cancelación → draft.cancellationPolicy */}
      <section>
        <MiniHeader icon={Clock3} label="Política de cancelación" />
        <div className="flex flex-col gap-2.5" role="group" aria-label="Política de cancelación">
          {CANCELLATION_POLICIES.map((policy) => (
            <CancellationRow
              key={policy.value}
              title={policy.label}
              subtitle={policy.subtitle}
              active={draft.cancellationPolicy === policy.value}
              onClick={() => patch({ cancellationPolicy: policy.value })}
            />
          ))}
        </div>
      </section>

      {/* Reglas de tu estudio → draft.rules */}
      <section>
        <MiniHeader icon={ShieldCheck} label="Reglas de tu estudio" />
        <div className="flex flex-col gap-2">
          {FIXED_RULES.map((rule) => (
            <RuleSwitchRow
              key={rule.value}
              icon={rule.icon}
              title={rule.label}
              subtitle={rule.subtitle}
              active={draft.rules.includes(rule.value)}
              onClick={() => toggleFixedRule(rule.value)}
            />
          ))}
        </div>

        {otherActive ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-card px-3.5 py-3">
            <label htmlFor="policies-other-rule" className="sr-only">
              Otras reglas
            </label>
            <input
              id="policies-other-rule"
              type="text"
              value={customRule ?? ''}
              onChange={(e) => onCustomRuleChange(e.target.value)}
              placeholder="Ej. No se admiten menores de edad sin acompañante"
              maxLength={120}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={toggleOtherRule}
              aria-label="Quitar regla personalizada"
              className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              Quitar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleOtherRule}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Nueva regla personalizada
          </button>
        )}
      </section>

      {/* Nota final */}
      <div className="flex items-start gap-3 rounded-2xl bg-card/40 p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Estas políticas se incluirán en tus cotizaciones PDF, reservas y recordatorios automáticos.
        </p>
      </div>
    </div>
  )
}
