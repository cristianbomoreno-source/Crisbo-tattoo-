'use client'

import { Lightbulb, Check, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INTAKE_STYLES } from '@/lib/validations/intake'
import { styleRender } from '@/lib/body-render-assets'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** `INTAKE_STYLES` sin 'Otro' ni 'No lo sé' (spec §2): 'Otro' es el campo de
 * texto libre debajo del grid; 'No lo sé' no aplica — el artista SÍ conoce
 * sus estilos. */
const SPECIALTY_STYLES = INTAKE_STYLES.filter((s) => s !== 'Otro' && s !== 'No lo sé')

/**
 * Paso 2 — Especialidad (opcional). Multi-select de estilos sobre
 * `draft.styles`, SIN límite de cantidad (a pedido). Tarjetas grandes (2 por
 * fila) con foto protagonista y pequeña animación de escala al seleccionar,
 * + campo "Otro estilo".
 */
export function StepSpecialty({ draft, patch }: OnboardingStepProps) {
  function toggleStyle(style: string) {
    const active = draft.styles.includes(style)
    patch({ styles: active ? draft.styles.filter((s) => s !== style) : [...draft.styles, style] })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-card/40 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            Elige todos los estilos que tatúes. Puedes seleccionar los que quieras.
          </p>
        </div>
        {draft.styles.length > 0 && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 font-display text-xs font-bold tabular-nums text-primary">
            {draft.styles.length} seleccionada{draft.styles.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SPECIALTY_STYLES.map((style) => {
          const active = draft.styles.includes(style)
          const image = styleRender(style)
          return (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              aria-pressed={active}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-card p-2 text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'scale-[1.02] border-primary shadow-[0_0_0_1px_var(--primary)]' : 'scale-100 border-border hover:border-primary/40'
              )}
            >
              <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-title text-3xl text-muted-foreground/30" aria-hidden="true">
                    {style.charAt(0)}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border transition-all duration-200',
                    active
                      ? 'scale-100 border-primary bg-primary text-primary-foreground opacity-100'
                      : 'scale-75 border-muted-foreground/40 bg-background/60 opacity-80'
                  )}
                >
                  {active && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
                </span>
              </span>
              <span
                className={cn(
                  'line-clamp-2 font-display text-xs font-semibold uppercase leading-tight tracking-wide',
                  active ? 'text-primary' : 'text-foreground'
                )}
              >
                {style}
              </span>
            </button>
          )
        })}
      </div>

      <div>
        <label
          htmlFor="specialty-other"
          className="mb-1.5 flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wide text-foreground"
        >
          <Pencil className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
          Otro estilo
        </label>
        <input
          id="specialty-other"
          type="text"
          value={draft.otherStyle}
          onChange={(e) => patch({ otherStyle: e.target.value })}
          placeholder="¿Tatúas algún otro estilo?"
          className="w-full rounded-2xl bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  )
}
