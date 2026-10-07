'use client'

import * as React from 'react'
import { CalendarDays, Minus, PiggyBank, Plus, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  SESSION_OPTIONS,
  DURATION_STEP_MIN,
  DURATION_MIN,
  DURATION_MAX,
} from '@/components/quote-wizard/constants'
import type { WizardDraft } from '@/components/quote-wizard/quote-wizard'
import { cop } from '@/lib/projects/metrics'
import { depositPercentageFor, type StudioDeposit } from '@/lib/quotes/deposit'

type StepPriceProps = {
  draft: WizardDraft
  patch: (patch: Partial<WizardDraft>) => void
  studioDeposit?: StudioDeposit | null
}

const DESCRIPTION_MAX = 500
const SESSION_STEPPER_MIN = 4
const SESSION_STEPPER_MAX = 30

/**
 * "Xh Ym" — mismo formato legible que `avg_session_duration` acepta hoy
 * (`quote-form.tsx` lo guarda como texto libre, ej. "2-3 horas"; no hay un
 * formato estructurado existente que replicar al pie de la letra). Task 5
 * debe usar ESTE formato exacto al convertir `durationMin` → string para
 * guardar en `avg_session_duration`.
 */
// OJO: `export { x } from '...'` reexporta hacia afuera pero NO trae el nombre
// al alcance de este archivo — las llamadas de abajo a formatDuration daban
// ReferenceError en ejecución. Hay que importarlo Y reexportarlo por separado.
import { formatDuration, parseDurationLabel } from '@/lib/quote-wizard/duration'
export { formatDuration, parseDurationLabel }

function durationHint(min: number): string {
  if (min >= 180) return 'Ideal para piezas medianas a grandes'
  if (min < 120) return 'Ideal para piezas pequeñas'
  return 'Piezas medianas'
}

/**
 * Etiqueta + subtexto del hint de abono. `null` si no hay `studioDeposit`
 * configurado (sin config = sin hint, fallback total). El % aproximado en
 * modo `fixed` solo aparece cuando hay precio (usa el mismo helper puro que
 * el guardado, `depositPercentageFor`, para no duplicar la conversión).
 */
function depositHint(
  studioDeposit: StudioDeposit | null | undefined,
  price: number | ''
): { label: string; approxPercent: number | null } | null {
  if (!studioDeposit || !studioDeposit.mode) return null

  if (studioDeposit.mode === 'percent') {
    if (studioDeposit.value === null) return null
    const pct = Math.min(100, Math.max(1, studioDeposit.value))
    return { label: `${pct}% del valor`, approxPercent: null }
  }

  if (studioDeposit.mode === 'fixed') {
    if (studioDeposit.value === null || studioDeposit.value <= 0) return null
    const priceNum = price === '' ? NaN : Number(price)
    const approxPercent = depositPercentageFor(studioDeposit, priceNum)
    return { label: `${cop(studioDeposit.value)} COP`, approxPercent }
  }

  return null
}

/** Mini-encabezado de sub-sección, mismo patrón visual que `step-details.tsx`. */
function MiniHeader({ label, required }: { label: string; required?: boolean }) {
  return (
    <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide">
      {label}
      {required && (
        <span className="ml-0.5 text-primary" aria-hidden="true">
          *
        </span>
      )}
    </h3>
  )
}

function RoundStepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Dial circular de duración: anillo con progreso rojo + valor central + −/+. */
function DurationDial({
  durationMin,
  onChange,
}: {
  durationMin: number
  onChange: (min: number) => void
}) {
  const clamped = Math.max(DURATION_MIN, Math.min(DURATION_MAX, durationMin))
  const pct = clamped / DURATION_MAX
  const r = 42
  const c = 2 * Math.PI * r
  const dash = pct * c

  return (
    <div className="flex items-center justify-center gap-4">
      <RoundStepButton
        onClick={() => onChange(Math.max(DURATION_MIN, clamped - DURATION_STEP_MIN))}
        disabled={clamped <= DURATION_MIN}
        label="Reducir duración"
      >
        <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
      </RoundStepButton>

      <div className="relative flex size-32 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="size-full -rotate-90"
          role="img"
          aria-label={`Duración por sesión: ${formatDuration(clamped)}`}
        >
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash.toFixed(2)} ${c.toFixed(2)}`}
          />
        </svg>
        <span className="absolute font-title text-2xl tabular-nums" aria-hidden="true">
          {formatDuration(clamped)}
        </span>
      </div>

      <RoundStepButton
        onClick={() => onChange(Math.min(DURATION_MAX, clamped + DURATION_STEP_MIN))}
        disabled={clamped >= DURATION_MAX}
        label="Aumentar duración"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
      </RoundStepButton>
    </div>
  )
}

/** 1 · 2 · 3 · 4+ cards; al elegir "4+" aparece un stepper para el número exacto (4-30). */
function SessionCountPicker({
  sessionCount,
  onChange,
}: {
  sessionCount: number
  onChange: (n: number) => void
}) {
  const isCustom = sessionCount >= 4

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2.5">
        {SESSION_OPTIONS.map((n) => {
          const active = n === 4 ? sessionCount >= 4 : sessionCount === n
          const label = n === 4 ? '4+' : String(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n === 4 ? Math.max(sessionCount, 4) : n)}
              aria-pressed={active}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-card py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}
            >
              <span
                className={cn(
                  'font-title text-xl tabular-nums',
                  active ? 'text-primary' : 'text-foreground'
                )}
              >
                {label}
              </span>
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(n, 4) }).map((_, i) => (
                  <CalendarDays
                    key={i}
                    className={cn('size-2.5', active ? 'text-primary' : 'text-muted-foreground/50')}
                    strokeWidth={2}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      {isCustom && (
        <div className="flex items-center justify-center gap-4 rounded-xl border border-border p-3">
          <RoundStepButton
            onClick={() => onChange(Math.max(SESSION_STEPPER_MIN, sessionCount - 1))}
            disabled={sessionCount <= SESSION_STEPPER_MIN}
            label="Reducir número de sesiones"
          >
            <Minus className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </RoundStepButton>
          <span className="font-title text-2xl tabular-nums">{sessionCount}</span>
          <RoundStepButton
            onClick={() => onChange(Math.min(SESSION_STEPPER_MAX, sessionCount + 1))}
            disabled={sessionCount >= SESSION_STEPPER_MAX}
            label="Aumentar número de sesiones"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </RoundStepButton>
        </div>
      )}
    </div>
  )
}

/**
 * Paso 4 — Precio: idea, sesiones, duración por sesión y valor. Ver spec
 * §"4 · Precio". Mínimo para continuar: descripción ≥10 chars y precio > 0
 * (`canContinue` en quote-wizard.tsx).
 */
export function StepPrice({ draft, patch, studioDeposit }: StepPriceProps) {
  const priceDisplay = draft.price === '' ? '' : draft.price.toLocaleString('es-CO')
  const hint = depositHint(studioDeposit, draft.price)

  return (
    <div className="flex flex-col gap-7">
      {/* Describe tu idea → draft.description */}
      <section>
        <Label
          htmlFor="wizard-description"
          className="mb-3 block font-display text-xs font-semibold uppercase tracking-wide"
        >
          Describe tu idea
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="wizard-description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Ej: Un lobo geométrico en el antebrazo, estilo línea fina, sin color..."
        />
        <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
          {draft.description.length}/{DESCRIPTION_MAX}
        </p>
      </section>

      {/* Número de sesiones → draft.sessionCount */}
      <section>
        <MiniHeader label="Número de sesiones" required />
        <SessionCountPicker sessionCount={draft.sessionCount} onChange={(sessionCount) => patch({ sessionCount })} />
      </section>

      {/* Duración aproximada por sesión → draft.durationMin */}
      <section>
        <MiniHeader label="Duración aproximada por sesión" />
        <DurationDial durationMin={draft.durationMin} onChange={(durationMin) => patch({ durationMin })} />
        <div className="mt-4 rounded-xl border border-border p-3.5 text-center">
          <p className="text-sm font-medium">
            Duración por sesión: <span className="tabular-nums">{formatDuration(draft.durationMin)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{durationHint(draft.durationMin)}</p>
        </div>
      </section>

      {/* Valor del tatuaje → draft.price */}
      <section>
        <Label
          htmlFor="wizard-price"
          className="mb-3 block font-display text-xs font-semibold uppercase tracking-wide"
        >
          Valor del tatuaje
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            COP
          </span>
          <Input
            id="wizard-price"
            inputMode="numeric"
            value={priceDisplay}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              patch({ price: digits === '' ? '' : Number(digits) })
            }}
            placeholder="0"
            className="h-12 pl-14 text-right font-title text-lg tabular-nums"
          />
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl border border-border p-3.5">
          <ShieldCheck className="size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            Este valor puede ajustarse en el resumen final según los detalles del proyecto.
          </p>
        </div>

        {hint && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-border p-3.5">
            <PiggyBank className="size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <div>
              <p className="text-xs font-medium">
                Abono para reservar: <span className="font-semibold">{hint.label}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Configurado en tu perfil — se aplicará a esta cotización
                {hint.approxPercent !== null && ` · ≈ ${hint.approxPercent}% del valor`}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
