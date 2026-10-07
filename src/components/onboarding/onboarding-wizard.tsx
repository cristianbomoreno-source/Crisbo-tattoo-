'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ok, type Result } from '@/lib/errors/types'
import {
  completeProfileStep,
  saveOnboardingStep,
  finishOnboarding,
  type OnboardingPrefill,
} from '@/actions/onboarding'
import { uploadStudioLogo } from '@/actions/studio'
import type { OnboardingStepKey } from '@/lib/validations/onboarding'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'
import { StepShell } from '@/components/onboarding/step-shell'
import { StepProfile } from '@/components/onboarding/step-profile'
import { StepSpecialty } from '@/components/onboarding/step-specialty'
import { StepExperience } from '@/components/onboarding/step-experience'
import { StepStudio } from '@/components/onboarding/step-studio'
import { StepSocials } from '@/components/onboarding/step-socials'
import { StepDeposit } from '@/components/onboarding/step-deposit'
import { StepPolicies } from '@/components/onboarding/step-policies'
import { StepReview } from '@/components/onboarding/step-review'
import { OnboardingFinalizing } from '@/components/onboarding/onboarding-finalizing'

/** Estado del onboarding tal como lo devuelve `getOnboardingState()` (Task 2). */
export type OnboardingState = {
  hasStudio: boolean
  stepsDone: OnboardingStepKey[]
  prefill: OnboardingPrefill
}

/** Draft del wizard: TODOS los campos de los 8 pasos. Se inicializa del
 * prefill del server (registro + valores actuales, para reingreso), más
 * `logoFile`: campo SOLO de cliente (Task 4) — el `File` elegido en el paso
 * 1 vive acá hasta que `saveStep('profile', …)` lo sube reusando la action
 * de Ajustes (`uploadStudioLogo`); no viene de `OnboardingPrefill` porque el
 * server no puede prellenar un `File`. */
export type OnboardingDraft = OnboardingPrefill & { logoFile: File | null }

/** Props que reciben los componentes de cada paso (Tasks 4-7). */
export type OnboardingStepProps = {
  draft: OnboardingDraft
  patch: (next: Partial<OnboardingDraft>) => void
}

/** Mínimo requerido por paso para poder avanzar. Solo 'profile' y 'studio'
 * (los obligatorios, spec decisión 1) validan algo; el resto siempre puede
 * continuar (son opcionales — "Configurar después" hace lo mismo sin guardar). */
export function canContinue(step: OnboardingStepKey, draft: OnboardingDraft): boolean {
  switch (step) {
    case 'profile':
      return draft.name.trim().length >= 2
    case 'studio':
      return !!draft.studioType && draft.openDays.length > 0
    case 'socials':
      // Espeja `socialsStepSchema.slug` (lib/validations/onboarding.ts): slug
      // vacío es válido (se omite al guardar y se conserva el actual); con
      // valor, debe cumplir el mismo regex del schema — bloquea CONTINUAR en
      // vez de dejar que el usuario descubra el error recién al guardar.
      return !draft.slug || /^[a-z0-9-]{3,40}$/.test(draft.slug)
    case 'deposit':
      // Espeja `depositStepSchema` (lib/validations/onboarding.ts): si hay
      // modo elegido, el monto es obligatorio Y positivo (`.positive()` en el
      // schema — con 0 el guardado también revienta) — bloquea CONTINUAR en
      // vez de dejar que el usuario descubra el error recién al guardar.
      return !draft.depositMode || (draft.depositValue !== undefined && draft.depositValue > 0)
    default:
      return true
  }
}

/** Copy del shell (kicker ya lo arma StepShell) por paso — spec §"Los 8 pasos".
 * Las Tasks 4-7 reemplazan el `children` (placeholder); esta copy queda igual. */
const STEP_CONTENT: Record<OnboardingStepKey, { titleLine1: string; titleLine2: string; subtitle: string }> = {
  profile: {
    titleLine1: 'CUÉNTANOS',
    titleLine2: 'quién eres',
    subtitle: 'Así te van a conocer tus clientes en OFINK.',
  },
  specialty: {
    titleLine1: 'TU',
    titleLine2: 'especialidad',
    subtitle: 'Elige los estilos que más tatúas. Puedes elegir varios.',
  },
  experience: {
    titleLine1: 'TU',
    titleLine2: 'experiencia',
    subtitle: 'Esto nos ayuda a personalizar funciones y estadísticas para ti.',
  },
  studio: {
    titleLine1: 'TU',
    titleLine2: 'estudio',
    subtitle: 'Configuraremos tu calendario, disponibilidad y capacidad.',
  },
  socials: {
    titleLine1: 'TUS REDES',
    titleLine2: 'sociales',
    subtitle: 'Se mostrarán en tus cotizaciones PDF y tu enlace de reservas.',
  },
  deposit: {
    titleLine1: 'ABONO PARA',
    titleLine2: 'reservar',
    subtitle: 'Se mostrará en tus cotizaciones. Puedes cambiarlo cuando quieras.',
  },
  policies: {
    titleLine1: 'POLÍTICAS Y',
    titleLine2: 'condiciones',
    subtitle: 'Se incluirán en tus cotizaciones PDF y recordatorios.',
  },
  review: {
    titleLine1: '¡TODO LISTO!',
    titleLine2: 'revisa y confirma',
    subtitle: 'Podrás editar esta información después.',
  },
}

/** Guarda el paso actual vía la action correcta (Task 2). 'profile' usa
 * `completeProfileStep` (crea o actualiza estudio+artista); 'review' es un
 * caso defensivo — `goNext` lo intercepta antes (rama `isLast`) y llama
 * `finishOnboarding()`, así que esta rama nunca se ejecuta en la práctica. */
async function saveStep(
  step: OnboardingStepKey,
  draft: OnboardingDraft,
  patch: (next: Partial<OnboardingDraft>) => void
): Promise<Result<void>> {
  switch (step) {
    case 'profile': {
      const result = await completeProfileStep({
        name: draft.name,
        artisticName: draft.artisticName,
        city: draft.city,
        whatsapp: draft.whatsapp,
      })
      if (!result.success) return result
      // El slug se genera/confirma en este paso — lo reflejamos en el draft
      // para que el paso 5 (redes, vista previa del enlace) parta del real.
      patch({ slug: result.data.slug })

      // Logo del estudio (Task 4): se sube DESPUÉS de que el estudio exista
      // (uploadStudioLogo exige studio vía requireOwner), reusando la MISMA
      // action/bucket/límites del uploader de Ajustes — no se inventa un
      // flujo nuevo. Si el usuario no eligió foto, se omite (opcional).
      if (draft.logoFile) {
        const fd = new FormData()
        fd.append('file', draft.logoFile)
        const logoResult = await uploadStudioLogo(fd)
        if (!logoResult.success) return logoResult
        patch({ logoFile: null })
      }

      return ok(undefined)
    }

    case 'specialty':
      return saveOnboardingStep('specialty', { styles: draft.styles, otherStyle: draft.otherStyle })

    case 'experience':
      return saveOnboardingStep('experience', {
        experienceRange: draft.experienceRange || undefined,
        fullTime: draft.fullTime,
        ownStudio: draft.ownStudio,
      })

    case 'studio':
      return saveOnboardingStep('studio', {
        studioType: draft.studioType,
        address: draft.address || undefined,
        mapsUrl: draft.mapsUrl || undefined,
        artistCount: draft.artistCount || undefined,
        openDays: draft.openDays,
        openTime: draft.openTime || undefined,
        closeTime: draft.closeTime || undefined,
      })

    case 'socials':
      return saveOnboardingStep('socials', {
        instagram: draft.instagram,
        tiktok: draft.tiktok,
        facebook: draft.facebook,
        website: draft.website,
        slug: draft.slug || undefined,
      })

    case 'deposit':
      return saveOnboardingStep('deposit', {
        depositMode: draft.depositMode || undefined,
        depositValue: draft.depositValue,
      })

    case 'policies':
      return saveOnboardingStep('policies', {
        paymentPolicy: draft.paymentPolicy || undefined,
        cancellationPolicy: draft.cancellationPolicy || undefined,
        // Normaliza + descarta entradas vacías: "Otras reglas" (step-policies.tsx)
        // puede dejar un placeholder '' en `draft.rules` mientras el usuario no
        // ha escrito nada todavía — `policiesStepSchema` exige `min(1)` por
        // entrada, así que enviarla tal cual rompería el guardado del paso.
        rules: draft.rules.map((r) => r.trim()).filter((r) => r.length > 0),
      })

    case 'review':
      return ok(undefined)
  }
}

export function OnboardingWizard({
  state,
  initialStep = 0,
}: {
  state: OnboardingState
  initialStep?: number
}) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = React.useState(() =>
    Math.min(Math.max(initialStep, 0), ONBOARDING_STEPS.length - 1)
  )
  // `openTime`/`closeTime` por defecto (10:00-20:00, paso 4 §"Horario de
  // atención"): se fijan en el inicializador (no en un `useEffect` con
  // `patch` — el React Compiler del proyecto marca setState-en-efecto como
  // error, ver comentario en step-profile.tsx) para que si el usuario nunca
  // toca los selects, el valor mostrado sea el mismo que se guarda.
  const [draft, setDraft] = React.useState<OnboardingDraft>(() => ({
    ...state.prefill,
    logoFile: null,
    openTime: state.prefill.openTime || '10:00',
    closeTime: state.prefill.closeTime || '20:00',
  }))
  const [saving, setSaving] = React.useState(false)
  const [finalizing, setFinalizing] = React.useState(false)
  const [finalizeReady, setFinalizeReady] = React.useState(false)

  // `ONBOARDING_STEPS[0]!`: a diferencia de `WIZARD_STEPS` (tupla `as const`),
  // `ONBOARDING_STEPS` está tipado como array simple (Task 1), así que
  // `noUncheckedIndexedAccess` no sabe que el índice 0 siempre existe.
  // `stepIndex` queda clamped a [0, length-1] por goNext/goBack/skip.
  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0]!
  const stepKey = step.key
  const isFirst = stepIndex === 0
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1

  const patch = React.useCallback((next: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...next }))
  }, [])

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  // "Configurar después": solo en pasos opcionales, avanza SIN guardar y SIN
  // marcar el paso como hecho (spec decisión 1 / criterio 2 del checklist).
  function skip() {
    if (step.required || isLast) return
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1))
  }

  // Task 7: navegación directa a un paso arbitrario — SOLO la usa el paso 8
  // (cada fila de "RESUMEN DE TU REGISTRO" en step-review.tsx vuelve a su
  // paso). Nada se guarda al volver (igual que `goBack`): el draft ya vive
  // en el wizard, así que no hay pérdida de datos. Bloqueada mientras
  // `saving` está en vuelo, mismo criterio que "Atrás" en StepShell.
  function goToStep(index: number) {
    if (saving) return
    setStepIndex(Math.min(Math.max(index, 0), ONBOARDING_STEPS.length - 1))
  }

  async function goNext() {
    if (!canContinue(stepKey, draft)) return
    setSaving(true)

    if (isLast) {
      setFinalizing(true)
      const result = await finishOnboarding()
      setSaving(false)
      if (!result.success) {
        setFinalizing(false)
        toast.error(result.error.message)
        return
      }
      setFinalizeReady(true)
      return
    }

    const result = await saveStep(stepKey, draft, patch)
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    // Índice capturado (no functional update): mientras `saving` toda la
    // navegación está deshabilitada en StepShell, así que `stepIndex` no pudo
    // cambiar durante el await — avanzamos desde el paso que se guardó.
    setStepIndex(Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1))
  }

  const content = STEP_CONTENT[stepKey]

  if (finalizing) {
    return <OnboardingFinalizing ready={finalizeReady} onDone={() => router.push('/onboarding/listo')} />
  }

  return (
    <StepShell
      stepIndex={stepIndex}
      titleLine1={content.titleLine1}
      titleLine2={content.titleLine2}
      subtitle={content.subtitle}
      onBack={isFirst ? undefined : goBack}
      onContinue={goNext}
      onSkip={!step.required && !isLast ? skip : undefined}
      canContinue={canContinue(stepKey, draft)}
      saving={saving}
      continueLabel={isLast ? 'FINALIZAR REGISTRO' : 'CONTINUAR'}
      // Caption bajo el CTA solo en el paso 8 (spec §8) — el subtítulo de
      // arriba (STEP_CONTENT.review) ya usa el mismo texto para el kicker de
      // la página; repetirlo pegado al botón de FINALIZAR es intencional
      // (brief Task 7): es la última garantía que ve el usuario antes de confirmar.
      footerNote={isLast ? 'Podrás editar esta información después.' : undefined}
    >
      {stepKey === 'profile' ? (
        <StepProfile draft={draft} patch={patch} />
      ) : stepKey === 'specialty' ? (
        <StepSpecialty draft={draft} patch={patch} />
      ) : stepKey === 'experience' ? (
        <StepExperience draft={draft} patch={patch} />
      ) : stepKey === 'studio' ? (
        <StepStudio draft={draft} patch={patch} />
      ) : stepKey === 'socials' ? (
        <StepSocials draft={draft} patch={patch} />
      ) : stepKey === 'deposit' ? (
        <StepDeposit draft={draft} patch={patch} />
      ) : stepKey === 'policies' ? (
        <StepPolicies draft={draft} patch={patch} />
      ) : (
        <StepReview draft={draft} patch={patch} goToStep={goToStep} />
      )}
    </StepShell>
  )
}
