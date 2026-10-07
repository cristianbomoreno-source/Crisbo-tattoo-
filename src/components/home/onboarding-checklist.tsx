import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'

/**
 * Card del Inicio que ofrece retomar el onboarding cuando quedaron pasos
 * pendientes (`studios.onboarding_steps_done`, spec `docs/superpowers/specs/2026-07-10-onboarding-8-pasos-design.md`
 * criterio 2). `null` cuando los 8 pasos están hechos — desaparece del Inicio.
 *
 * Estudios creados ANTES de este onboarding (usuarios existentes) tienen
 * `onboarding_steps_done = '{}'`: verán esta card en 0/8, incluyendo 'profile'
 * como pendiente aunque ya tengan nombre/estudio — es el comportamiento
 * deseado por el spec (criterio 6: no se fuerza el onboarding, pero el
 * Inicio SÍ ofrece los pasos nuevos). Reingresar al paso 'profile' es
 * inofensivo: `completeProfileStep` hace upsert sobre los mismos datos.
 */
export function OnboardingChecklist({ stepsDone }: { stepsDone: string[] }) {
  const doneSet = new Set(stepsDone)
  const pending = ONBOARDING_STEPS.filter((s) => !doneSet.has(s.key))

  const firstPending = pending[0]
  if (!firstPending) return null

  const doneCount = ONBOARDING_STEPS.length - pending.length
  const pct = Math.round((doneCount / ONBOARDING_STEPS.length) * 100)
  const firstPendingKey = firstPending.key

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div className="flex items-center gap-3 sm:flex-1">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 text-primary"
        >
          <ClipboardCheck className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold uppercase tracking-tight">
            Completa tu perfil
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doneCount} de {ONBOARDING_STEPS.length} pasos listos
          </p>
          <div className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <Link
        href={`/onboarding?step=${firstPendingKey}`}
        className={buttonVariants({ className: 'shrink-0' })}
      >
        Continuar configuración →
      </Link>
    </div>
  )
}
