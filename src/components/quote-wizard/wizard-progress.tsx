import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStepKey } from '@/components/quote-wizard/constants'

type Step = { key: WizardStepKey; label: string }

/**
 * Barra de progreso del wizard de cotización: N nodos conectados por líneas.
 * Completado = check + línea roja. Actual = círculo rojo relleno + etiqueta
 * roja. Futuro = círculo `bg-secondary` + etiqueta muted. Fluida (`clamp`)
 * para caber en 375px. Ver DESIGN.md §4 y spec §"Estructura del wizard".
 */
export function WizardProgress({ steps, current }: { steps: readonly Step[]; current: number }) {
  return (
    <div className="px-4 py-3 sm:px-6" aria-hidden="true">
      <div className="mx-auto flex max-w-xl items-start">
        {steps.map((s, i) => {
          const done = i < current
          const isCurrent = i === current
          return (
            <div key={s.key} className="flex flex-1 items-start last:flex-initial">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-[clamp(1.5rem,7vw,1.75rem)] shrink-0 items-center justify-center rounded-full font-display text-[clamp(0.65rem,3vw,0.75rem)] font-semibold transition-colors',
                    (done || isCurrent) && 'bg-primary text-primary-foreground',
                    !done && !isCurrent && 'bg-secondary text-muted-foreground'
                  )}
                >
                  {done ? <Check className="size-[clamp(0.75rem,3.2vw,0.9rem)]" strokeWidth={2.5} /> : i + 1}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap font-display text-[clamp(0.5rem,2.2vw,0.62rem)] font-medium uppercase tracking-wider',
                    isCurrent && 'text-primary',
                    done && 'text-foreground',
                    !done && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mt-[clamp(0.72rem,3.4vw,0.85rem)] h-px flex-1 translate-x-1 transition-colors',
                    done ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
