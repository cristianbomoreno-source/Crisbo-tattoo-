'use client'

import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress'

const TOTAL_STEPS = ONBOARDING_STEPS.length

/**
 * Layout común de cada paso del onboarding (spec §"Los 8 pasos", shell común):
 * fondo `paso-N.jpg` atenuado (mismo patrón que `(auth)/layout.tsx`), header
 * (← atrás · wordmark · N / 8), barra de progreso, kicker "PASO N", título de
 * 2 líneas, subtítulo, `children` (contenido del paso) y footer sticky con el
 * CTA + "Configurar después" opcional.
 */
export function StepShell({
  stepIndex,
  titleLine1,
  titleLine2,
  subtitle,
  children,
  onBack,
  onContinue,
  onSkip,
  canContinue,
  saving = false,
  continueLabel = 'CONTINUAR',
  skipLabel = 'Configurar después',
  footerNote,
}: {
  /** Índice 0-based dentro de `ONBOARDING_STEPS`. */
  stepIndex: number
  titleLine1: string
  titleLine2?: string
  subtitle?: string
  children: React.ReactNode
  /** Si se omite, el botón "Atrás" no se muestra (paso 1: el onboarding no se cancela). */
  onBack?: () => void
  onContinue: () => void
  /** Solo se muestra "Configurar después" cuando el paso llamador lo pasa (pasos opcionales). */
  onSkip?: () => void
  canContinue: boolean
  saving?: boolean
  continueLabel?: string
  skipLabel?: string
  /** Texto pequeño debajo del CTA/skip (paso 8, spec §8: "Podrás editar esta
   * información después."). Opcional — el resto de pasos no lo usa. */
  footerNote?: string
}) {
  const stepNumber = stepIndex + 1

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      {/* Fondo de arte del paso — capa fija atenuada + overlay, mismo patrón
          que `(auth)/layout.tsx` (auth-bg.jpg) pero con el arte por paso. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-top opacity-40"
        style={{ backgroundImage: `url(/brand/onboarding/paso-${stepNumber}.jpg)` }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-background/50" />

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* Header: atrás (oculto en paso 1) · wordmark · N / 8 (N en rojo) */}
        <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:px-6">
          <div className="w-10">
            {onBack ? (
              /* `disabled={saving}`: durante el guardado se bloquea TODA la
                 navegación (igual que el CTA y "Configurar después") — si no,
                 el usuario retrocede y el setStepIndex del guardado en vuelo
                 lo re-lanza hacia adelante pisando su navegación. */
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                aria-label="Atrás"
                className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <ArrowLeft className="size-5" strokeWidth={1.8} />
              </button>
            ) : (
              <div className="size-10" aria-hidden="true" />
            )}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cb-icon.png" alt="Crisbo Tattoo" className="h-8 w-auto rounded-md" />

          <div className="w-10 text-right">
            <span className="font-display text-[clamp(0.65rem,2.8vw,0.75rem)] uppercase tracking-wider text-muted-foreground">
              <span className="text-primary">{stepNumber}</span> / {TOTAL_STEPS}
            </span>
          </div>
        </div>

        <OnboardingProgress current={stepIndex} />

        {/* Cuerpo del paso. `pb-36`: reserva el espacio del footer, que pasó
            de `sticky` a `fixed` (ver nota en el footer más abajo) para
            evitar que flote a mitad de pantalla y tape el campo enfocado
            cuando se abre el teclado en iOS. */}
        <div className="flex-1 px-4 py-6 pb-36 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-display text-[clamp(0.65rem,2.8vw,0.75rem)] font-medium italic uppercase tracking-[0.2em] text-primary">
                  Paso {stepNumber}
                </span>
                <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-primary" />
              </div>

              <h1 className="leading-[0.95]">
                <span className="block font-title text-[clamp(1.75rem,7vw,2.5rem)] uppercase text-foreground">
                  {titleLine1}
                </span>
                {titleLine2 ? (
                  <span className="relative mt-1.5 inline-block pb-1 font-display text-[clamp(1.05rem,4.6vw,1.4rem)] italic text-foreground">
                    {titleLine2}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                    />
                  </span>
                ) : null}
              </h1>

              {subtitle ? <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>

            {children}
          </div>
        </div>

        {/* Footer: CTA rojo glow + "Configurar después" opcional.
            `fixed` en vez de `sticky` — con `sticky`, al enfocar un campo de
            texto del paso (p.ej. nombre del estudio) y abrirse el teclado en
            iOS, Safari reduce el viewport visual y hace scroll para mostrar
            el campo, pero la barra sticky se calcula contra el viewport de
            layout (sin descontar el teclado) y terminaba flotando encima del
            propio campo — el mismo bug reportado en Ajustes → Mensajes.
            `fixed` sí seguía el viewport visual correctamente. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue || saving}
              className={cn(
                'glow-primary flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              {saving ? 'Guardando…' : continueLabel}
              {!saving && <ArrowRight className="size-4" strokeWidth={2} />}
            </button>

            {onSkip ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={saving}
                className="h-10 w-full cursor-pointer font-display text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {skipLabel}
              </Button>
            ) : null}

            {footerNote ? (
              <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
