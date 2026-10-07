'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const TOTAL = 7

export function EstudioStepShell({
  stepIndex,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  canContinue = true,
  saving = false,
  continueLabel = 'CONTINUAR',
}: {
  stepIndex: number
  title: string
  subtitle?: string
  children: React.ReactNode
  onBack?: () => void
  onContinue: () => void
  canContinue?: boolean
  saving?: boolean
  continueLabel?: string
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <span className="size-8" />
          )}
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Onboarding · Estudio
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {stepIndex + 1}/{TOTAL}
          </span>
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-md gap-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={cn('h-1 flex-1 rounded-full', i <= stepIndex ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      </header>

      {/* `pb-28`: reserva el espacio del footer, que pasó de `sticky` a
          `fixed` (ver nota abajo) para que no flote a mitad de pantalla al
          abrirse el teclado sobre un campo de este paso. */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 pb-28">
        <h1 className="font-title text-2xl uppercase leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>

      {/* `fixed` en vez de `sticky`: mismo bug de iOS que en
          `settings-subpage.tsx` — con `sticky`, al abrirse el teclado sobre
          un campo de este paso, Safari recalcula el scroll contra el
          viewport visual (más chico) pero la barra sticky seguía usando el
          viewport de layout completo y terminaba flotando sobre el campo
          enfocado en vez de quedarse pegada abajo. */}
      <footer className="fixed inset-x-0 bottom-0 z-20 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <Button
            type="button"
            className="w-full gap-2"
            size="lg"
            disabled={!canContinue || saving}
            onClick={onContinue}
          >
            {saving ? 'Guardando…' : continueLabel}
            {!saving && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
