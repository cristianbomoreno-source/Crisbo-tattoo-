import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'

const TOTAL_STEPS = ONBOARDING_STEPS.length

/**
 * Barra de progreso del onboarding: 8 nodos conectados por líneas, SIN
 * etiquetas de texto (con 8 pasos en 375px no caben — a diferencia de
 * `wizard-progress.tsx`, que sí las lleva con solo 5). Completado = check +
 * línea roja. Actual = círculo rojo relleno. Futuro = `bg-secondary` muted.
 * Fluida (`clamp`) para caber en 375px. Ver DESIGN.md §4.
 */
export function OnboardingProgress({ current }: { current: number }) {
  return (
    <div className="px-4 py-2.5 sm:px-6" aria-hidden="true">
      <div className="mx-auto flex max-w-xl items-center">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const done = i < current
          const isCurrent = i === current
          return (
            <div key={i} className="flex flex-1 items-center last:flex-initial">
              <div
                className={cn(
                  'flex size-[clamp(1.1rem,5.5vw,1.4rem)] shrink-0 items-center justify-center rounded-full font-display text-[clamp(0.55rem,2.4vw,0.62rem)] font-semibold transition-colors',
                  (done || isCurrent) && 'bg-primary text-primary-foreground',
                  !done && !isCurrent && 'bg-secondary text-muted-foreground'
                )}
              >
                {done ? (
                  <Check className="size-[clamp(0.6rem,2.6vw,0.72rem)]" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </div>
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={cn('h-px flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
