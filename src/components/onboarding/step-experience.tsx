'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Home,
  Building2,
  Sparkles,
  Check,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { abandonStudioForJoin } from '@/actions/team'
import { cn } from '@/lib/utils'
import { EXPERIENCE_RANGES } from '@/components/onboarding/constants'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Mini-encabezado de sub-sección: icono rojo chico + etiqueta Oswald mayúscula
 * (mismo patrón que `quote-wizard/step-details.tsx`; duplicado localmente
 * porque no está exportado desde allá — igual que `FieldLabel` en step-profile.tsx). */
function MiniHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide">{label}</h3>
    </div>
  )
}

/** Check rojo en esquina superior derecha (mismo patrón que step-details.tsx). */
function CornerCheck() {
  return (
    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/**
 * Paso 3 — Experiencia (opcional). Años tatuando (5 cards en fila; iconos
 * SIEMPRE blancos/outline — la selección se marca solo con borde + check) y
 * ¿cómo trabajas? (independiente / en un estudio). Ya no incluye "¿tiempo
 * completo o complemento?" (se quitó a pedido). "Configurar después" existe
 * en este paso (ver `ONBOARDING_STEPS` en constants.ts).
 */
export function StepExperience({ draft, patch }: OnboardingStepProps) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  /** "Trabajo en un estudio": el estudio-stub del paso 1 se borra (nunca
   * llegó a tener nada) y arranca limpio en /onboarding/join — sin esto,
   * esa página lo rebotaría al dashboard por ya "tener" un estudio. */
  async function leaveToJoin() {
    if (leaving) return
    setLeaving(true)
    await abandonStudioForJoin()
    router.push('/onboarding/join')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Años tatuando → draft.experienceRange */}
      <section>
        <MiniHeader icon={CalendarDays} label="¿Cuántos años llevas tatuando?" />
        <div className="grid grid-cols-5 gap-[clamp(0.25rem,1.2vw,0.5rem)]">
          {EXPERIENCE_RANGES.map((range) => {
            const active = draft.experienceRange === range.value
            const Icon = range.icon
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => patch({ experienceRange: range.value })}
                aria-pressed={active}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-card px-[clamp(0.15rem,0.8vw,0.35rem)] py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                {active && <CornerCheck />}
                {/* Icono siempre blanco/outline (brief §3): la selección la marca el borde + check. */}
                <Icon className="size-5 text-foreground" strokeWidth={1.7} aria-hidden="true" />
                <span className="line-clamp-2 font-display text-[clamp(0.48rem,1.9vw,0.58rem)] font-medium uppercase leading-tight tracking-wide text-foreground">
                  {range.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ¿Cómo trabajas? → solo botones, nada que escribir. "Independiente"
       * sigue el wizard igual que siempre; "Trabajo en un estudio" sale
       * hacia /onboarding/join (crear un estudio vive en la Pantalla 0,
       * "Tengo un estudio" — no se repite acá). */}
      <section>
        <MiniHeader icon={Home} label="¿Cómo trabajas?" />
        <div className="flex flex-col gap-3">
          <WorkModeCard
            icon={Home}
            title="Independiente"
            subtitle="Trabajo por mi cuenta y administro todo yo."
            active={draft.ownStudio === true}
            onClick={() => patch({ ownStudio: true })}
          />
          <WorkModeCard
            icon={Building2}
            title="Trabajo en un estudio"
            subtitle="Ya pertenezco a un estudio, quiero unirme."
            active={false}
            loading={leaving}
            onClick={leaveToJoin}
          />
        </div>
      </section>

      {/* Nota final */}
      <div className="flex items-start gap-3 rounded-2xl bg-card/40 p-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Esta información nos ayuda a mostrarte funciones, estadísticas y recomendaciones personalizadas.
        </p>
      </div>
    </div>
  )
}

/** Tarjeta grande para "¿Cómo trabajas?": ícono en glow + título + subtítulo
 * + flecha, todo tocable, sin ningún campo de texto (spec: "solo botones de
 * selección, que no toque escribir nada"). */
function WorkModeCard({
  icon: Icon,
  title,
  subtitle,
  active,
  loading,
  onClick,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  active: boolean
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={active}
      className={cn(
        'group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all disabled:opacity-50',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-4 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]"
      >
        <Icon className="size-24 text-primary" strokeWidth={1} />
      </span>
      <span
        className={cn(
          'relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl',
          active ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
        )}
      >
        <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="relative z-10 flex flex-1 flex-col gap-0.5">
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span className="relative z-10 shrink-0 text-primary">
        {active ? (
          <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        )}
      </span>
    </button>
  )
}
