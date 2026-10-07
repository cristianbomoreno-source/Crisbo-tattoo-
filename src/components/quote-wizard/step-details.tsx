'use client'

import * as React from 'react'
import {
  Ruler,
  Palette,
  SwatchBook,
  Contrast,
  Layers,
  ShieldQuestionMark,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WORK_TYPES } from '@/components/quote-wizard/constants'
import { INTAKE_STYLES, INTAKE_SKIN_TONES, INTAKE_SKIN_TONE_LABELS } from '@/lib/validations/intake'
import { BodySizeCards } from '@/components/intake/body-cards'
import { StyleCarousel } from '@/components/shared/style-carousel'
import type { WizardDraft } from '@/components/quote-wizard/quote-wizard'

type StepDetailsProps = {
  draft: WizardDraft
  patch: (patch: Partial<WizardDraft>) => void
}

/** `INTAKE_SKIN_TONE_LABELS` termina en "Prefiero no decir" — fuente de verdad, no se hardcodea. */
const SKIN_TONE_NO_ANSWER = INTAKE_SKIN_TONE_LABELS[INTAKE_SKIN_TONE_LABELS.length - 1]

/** Check rojo en esquina, reutilizado por todas las cards de este paso. */
function CornerCheck({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground',
        className
      )}
    >
      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/** Mini-encabezado de sub-sección: icono rojo chico + etiqueta Oswald mayúscula + asterisco si requerida. */
function MiniHeader({
  icon: Icon,
  label,
  required,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  required?: boolean
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide">
        {label}
        {required && (
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </h3>
    </div>
  )
}

/**
 * Paso 3 — Detalles: tamaño, estilo, color de piel, tipo de trabajo y cover
 * up. Secciones apiladas con mini-encabezados (ver spec §"3 · Detalles").
 * Mínimo para continuar: tamaño + estilo (`canContinue` en quote-wizard.tsx).
 */
export function StepDetails({ draft, patch }: StepDetailsProps) {
  return (
    <div className="flex flex-col gap-7">
      {/* Tamaño aproximado → draft.size (mismas tarjetas y fotos reales del bot) */}
      <section>
        <MiniHeader icon={Ruler} label="Tamaño aproximado" required />
        <div className="flex h-[26rem]">
          <BodySizeCards
            gender={draft.gender ?? 'Hombre'}
            initialValue={draft.size}
            onPick={(size) => patch({ size })}
          />
        </div>
      </section>

      {/* Estilos de tatuajes → draft.style (selección MÚLTIPLE, carrusel a
          todo el ancho — mismo componente que usa el bot y la cotización
          rápida, `lib/body-render-assets.ts` como fuente única de fotos). */}
      <section>
        <MiniHeader icon={Palette} label="Estilos de tatuajes" required />
        <StyleCarousel
          styles={INTAKE_STYLES.filter((s) => s !== 'No lo sé')}
          value={draft.style}
          onChange={(style) => patch({ style })}
        />
      </section>

      {/* Color de piel → draft.skinTone */}
      <section>
        <MiniHeader icon={SwatchBook} label="Color de piel" />
        <div className="flex flex-wrap items-center gap-2.5">
          {INTAKE_SKIN_TONES.map((tone) => {
            const active = draft.skinTone === tone.label
            return (
              <button
                key={tone.label}
                type="button"
                onClick={() => patch({ skinTone: tone.label })}
                aria-pressed={active}
                aria-label={tone.label}
                title={tone.label}
                style={{ backgroundColor: tone.hex }}
                className={cn(
                  'relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/60 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                {active && (
                  <Check
                    className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => patch({ skinTone: SKIN_TONE_NO_ANSWER })}
            aria-pressed={draft.skinTone === SKIN_TONE_NO_ANSWER}
            className={cn(
              'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              draft.skinTone === SKIN_TONE_NO_ANSWER
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            )}
          >
            {draft.skinTone === SKIN_TONE_NO_ANSWER && (
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
            )}
            {SKIN_TONE_NO_ANSWER}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          <span>← Más claro</span>
          <span>Más oscuro →</span>
        </div>
      </section>

      {/* Tipo de trabajo → draft.workType */}
      <section>
        <MiniHeader icon={Contrast} label="Tipo de trabajo" required />
        <div className="grid grid-cols-2 gap-3">
          {WORK_TYPES.map((wt) => {
            const active = draft.workType === wt.value
            const isColor = wt.value === 'Color'
            return (
              <button
                key={wt.value}
                type="button"
                onClick={() => patch({ workType: wt.value })}
                aria-pressed={active}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card px-3 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative flex size-11 items-center justify-center rounded-full',
                    isColor
                      ? 'bg-[conic-gradient(from_0deg,#E63946,#D6A23E,#62A878,#5B8CB0,#9B7FB8,#E63946)]'
                      : 'bg-gradient-to-br from-neutral-300 via-neutral-500 to-neutral-800'
                  )}
                >
                  {active && <CornerCheck className="-right-1 -top-1" />}
                </span>
                <span className="font-display text-[clamp(0.66rem,2.8vw,0.75rem)] font-semibold uppercase tracking-wide">
                  {wt.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ¿Es cover up? → draft.coverUp */}
      <section>
        <MiniHeader icon={Layers} label="¿Es cover up?" />
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: false, label: 'No', icon: ShieldQuestionMark },
              { value: true, label: 'Sí', icon: Layers },
            ] as const
          ).map((opt) => {
            const active = draft.coverUp === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => patch({ coverUp: opt.value })}
                aria-pressed={active}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-card px-3 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <Icon
                  className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="font-display text-sm font-semibold uppercase tracking-wide">{opt.label}</span>
                {active && <Check className="size-4 text-primary" strokeWidth={2.5} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
