'use client'

import { useRouter } from 'next/navigation'
import { UserRound, Building2, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

/**
 * Pantalla 0 del nuevo sistema de registro: 2 tarjetas grandes, casi a
 * pantalla completa, tipo "selecciona tu perfil" (Netflix/PlayStation) —
 * spec `PROMPT — NUEVO SISTEMA DE REGISTRO OFINK`. No es un formulario.
 * "Soy tatuador" → wizard de siempre (`/onboarding`); el paso 3
 * ("¿Cómo trabajas?") es donde se bifurca a unirse/crear un estudio.
 * "Tengo un estudio" → flujo nuevo, estudio-primero (`/onboarding/estudio`).
 */
export function ChooseAccountType() {
  const router = useRouter()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex justify-center pt-10 pb-6 sm:pt-14">
        <Logo full className="text-4xl" />
      </div>

      <div className="px-4 pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ¿Cómo quieres <span className="text-primary">usar OFINK</span>?
        </h1>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-6">
        <ProfileCard
          icon={UserRound}
          title="Soy tatuador"
          description="Gestiona tus clientes, agenda, proyectos y cotizaciones."
          cta="Continuar como tatuador"
          onClick={() => router.push('/onboarding')}
        />
        <ProfileCard
          icon={Building2}
          title="Tengo un estudio"
          description="Administra tu estudio y todos tus artistas desde un solo lugar."
          cta="Continuar como estudio"
          onClick={() => router.push('/onboarding/estudio')}
        />
      </div>
    </div>
  )
}

function ProfileCard({
  icon: Icon,
  title,
  description,
  cta,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description: string
  cta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[15rem] flex-1 cursor-pointer flex-col justify-end overflow-hidden rounded-[2rem] border border-white/10 bg-card p-6 text-left transition-all hover:border-primary/50 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[26rem] sm:p-8"
    >
      {/* Fondo: glow radial + ícono gigante desvanecido, sin depender de fotos reales. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/95 to-primary/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
      >
        <Icon className="size-56 text-primary" strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-7" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-title text-2xl uppercase leading-none sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-xs font-bold uppercase tracking-wide text-primary-foreground transition-transform group-hover:translate-x-0.5">
          {cta}
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </div>
      </div>
    </button>
  )
}
