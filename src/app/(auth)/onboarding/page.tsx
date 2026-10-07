import { redirect } from 'next/navigation'
import { getOnboardingState } from '@/actions/onboarding'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

/**
 * Wizard de onboarding de 8 pasos (spec `docs/superpowers/specs/2026-07-10-onboarding-8-pasos-design.md`).
 * Reemplaza el onboarding de 1 pregunta (studioName único) — `completeOnboarding`
 * de `actions/auth.ts` queda sin uso desde aquí (se limpia en la revisión final
 * de la rama, no en esta tarea).
 *
 * Reingreso: `?step=<clave>` usa la CLAVE del paso (`profile`, `specialty`, …
 * — la misma que `ONBOARDING_STEPS[].key`), no un índice numérico: es estable
 * aunque el orden de los pasos cambie, y es lo que monta el checklist del
 * Inicio (Task 8, p.ej. `/onboarding?step=socials`). Sin `step` válido, se
 * arranca en el primer paso pendiente (o el 0 si no hay ninguno hecho) — así
 * un usuario a mitad de camino que vuelve a `/onboarding` sin parámetro no
 * repite lo ya guardado.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const result = await getOnboardingState()
  if (!result.success) {
    redirect('/login')
  }

  const { step } = await searchParams
  const { hasStudio, stepsDone } = result.data

  const requestedIndex = ONBOARDING_STEPS.findIndex((s) => s.key === step)
  const firstPendingIndex = ONBOARDING_STEPS.findIndex((s) => !stepsDone.includes(s.key))
  // Si 'review' ya está marcado, el registro se dio por terminado (incluye
  // el caso de que el tatuador se haya ido a unirse/crear un estudio a
  // mitad de camino, ver step-experience.tsx) — no lo reanuda salvo que
  // pida explícitamente un paso puntual con ?step= (p. ej. desde el
  // checklist de Inicio).
  if (hasStudio && stepsDone.includes('review') && requestedIndex < 0) {
    redirect('/dashboard')
  }

  // Sin estudio, los pasos 2-8 no pueden guardar (`saveOnboardingStep` exige el
  // perfil completado) → se ignora cualquier `?step=` y se fuerza el paso 1.
  const initialStep = !hasStudio
    ? 0
    : requestedIndex >= 0
      ? requestedIndex
      : firstPendingIndex >= 0
        ? firstPendingIndex
        : 0

  return <OnboardingWizard state={result.data} initialStep={initialStep} />
}
