'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WIZARD_STEPS, type WizardStepKey } from '@/components/quote-wizard/constants'
import { WizardProgress } from '@/components/quote-wizard/wizard-progress'
import { StepClient } from '@/components/quote-wizard/step-client'
import { StepZone } from '@/components/quote-wizard/step-zone'
import { StepDetails } from '@/components/quote-wizard/step-details'
import { StepPrice } from '@/components/quote-wizard/step-price'
import { StepSummary } from '@/components/quote-wizard/step-summary'
import type { Client } from '@/queries/clients'
import type { StudioDeposit } from '@/lib/quotes/deposit'

/** Estado completo del wizard de cotización. Lo consumen los pasos (Tasks 3-5). */
export type WizardDraft = {
  clientMode: 'existing' | 'new'
  clientId?: string
  newClientName: string
  newClientPhone: string
  /** Solo decide qué fotos mostrar en el explorador de zona/tamaño — no se
   * guarda en la cotización (igual que en el bot). */
  gender?: 'Hombre' | 'Mujer'
  zone?: string
  size?: string
  style?: string
  skinTone?: string
  workType: string
  coverUp: boolean
  description: string
  sessionCount: number
  durationMin: number
  price: number | ''
}

const DEFAULT_DRAFT: WizardDraft = {
  clientMode: 'existing',
  clientId: undefined,
  newClientName: '',
  newClientPhone: '',
  gender: undefined,
  zone: undefined,
  size: undefined,
  style: undefined,
  skinTone: undefined,
  workType: 'Negro',
  coverUp: false,
  description: '',
  sessionCount: 1,
  durationMin: 180,
  price: '',
}

/** Mínimo requerido por paso para poder avanzar. */
export function canContinue(step: WizardStepKey, draft: WizardDraft): boolean {
  switch (step) {
    case 'client':
      return (
        (draft.clientMode === 'existing' && !!draft.clientId) ||
        (draft.clientMode === 'new' && draft.newClientName.trim().length >= 2)
      )
    case 'zone':
      return !!draft.zone
    case 'details':
      return !!draft.size && !!draft.style
    case 'price':
      return draft.description.trim().length >= 10 && Number(draft.price) > 0
    case 'summary':
      return true
    default:
      return false
  }
}

export function QuoteWizard({
  clients,
  quoteMessageTemplate,
  studioDeposit,
}: {
  clients: Client[]
  quoteMessageTemplate?: string
  studioDeposit?: StudioDeposit | null
}) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = React.useState(0)
  const [draft, setDraft] = React.useState<WizardDraft>(DEFAULT_DRAFT)
  const [confirmCancelOpen, setConfirmCancelOpen] = React.useState(false)
  // Guardado del paso Resumen: el botón real vive en el footer sticky de
  // acá abajo (antes vivía dentro de `StepSummary` y quedaba fuera de vista
  // sin hacer scroll). `StepSummary` sigue teniendo toda la lógica de
  // guardado — solo nos pasa su `handleSave` más reciente y si está
  // guardando, vía `onRegisterSave`/`onSavingChange`.
  const summarySaveRef = React.useRef<() => void>(() => {})
  const [summarySaving, setSummarySaving] = React.useState(false)

  // `WIZARD_STEPS[0]` como fallback: stepIndex siempre queda clamped a
  // [0, WIZARD_STEPS.length - 1] por goNext/goBack, pero TS no lo sabe con
  // noUncheckedIndexedAccess.
  const step = WIZARD_STEPS[stepIndex] ?? WIZARD_STEPS[0]
  const stepKey = step.key
  const isFirst = stepIndex === 0
  const isLast = stepIndex === WIZARD_STEPS.length - 1

  const patch = React.useCallback((next: Partial<WizardDraft>) => {
    setDraft((d) => ({ ...d, ...next }))
  }, [])

  function goNext() {
    if (!canContinue(stepKey, draft)) return
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function discardQuote() {
    setConfirmCancelOpen(false)
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard/quotes')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header: cerrar (paso 1) / atrás (pasos 2+) · título · "Paso N de 5"
          — `pt` suma el inset superior real (notch/isla dinámica) para que
          nunca quede debajo de la barra de estado del sistema. `sticky`:
          antes se iba scrolleando con el contenido, así que en pasos
          largos (Detalles, Zona) el resto del contenido terminaba
          asomando por encima, mezclándose con la barra de estado al hacer
          scroll — ahora el header (y su padding de isla) se queda fijo
          arriba SIEMPRE, sin importar el scroll. */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:px-6">
        <div className="w-10">
          {isFirst ? (
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(true)}
              aria-label="Cancelar"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" strokeWidth={1.8} />
            </button>
          ) : (
            <button
              type="button"
              onClick={goBack}
              aria-label="Atrás"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-5" strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <h1 className="font-display text-[clamp(0.85rem,3.6vw,1rem)] font-semibold uppercase tracking-wide">
            Nueva cotización
          </h1>
          <p className="font-display text-[clamp(0.6rem,2.6vw,0.68rem)] uppercase tracking-wider text-muted-foreground">
            Paso <span className="text-primary">{stepIndex + 1}</span> de {WIZARD_STEPS.length}
          </p>
        </div>

        <div className="w-10" aria-hidden="true" />
      </div>

      <WizardProgress steps={WIZARD_STEPS} current={stepIndex} />

      {/* Cuerpo: paso actual. `pb-32` deja aire de sobra para que el
          footer sticky nunca tape la última fila de contenido al hacer
          scroll hasta el final, incluso sumado al inset de home indicator. */}
      <div className="flex-1 px-4 py-5 pb-32 sm:px-6">
        <div className="mx-auto max-w-xl">
          {stepKey === 'client' && <StepClient draft={draft} patch={patch} clients={clients} />}
          {stepKey === 'zone' && <StepZone draft={draft} patch={patch} />}
          {stepKey === 'details' && <StepDetails draft={draft} patch={patch} />}
          {stepKey === 'price' && (
            <StepPrice draft={draft} patch={patch} studioDeposit={studioDeposit} />
          )}
          {stepKey === 'summary' && (
            <StepSummary
              draft={draft}
              clients={clients}
              quoteMessageTemplate={quoteMessageTemplate}
              studioDeposit={studioDeposit}
              onRegisterSave={(save) => { summarySaveRef.current = save }}
              onSavingChange={setSummarySaving}
            />
          )}
        </div>
      </div>

      {/* Footer FIJO al viewport (antes `sticky`, que depende de que el
          contenedor padre alcance exactamente 100dvh — con cualquier
          desajuste en esa cadena de altura, quedaba flotando con un hueco
          debajo en vez de pegado al borde real de la pantalla). `fixed` no
          depende de nada de eso: paso 1 Cancelar|Continuar; 2-4
          Atrás|Continuar; 5 Atrás|Guardar cotización (el botón "Guardar
          cotización" dispara el `handleSave` más reciente de `StepSummary`,
          registrado vía `onRegisterSave` — así queda siempre visible sin
          depender de scroll). Sube solo con el teclado gracias a
          `interactiveWidget: resizes-content` (ver `layout.tsx`). */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-xl gap-3">
          {isFirst ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmCancelOpen(true)}
              className={cn(
                'h-12 flex-1 cursor-pointer font-display text-sm font-semibold uppercase tracking-wider'
              )}
            >
              Cancelar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className={cn(
                'h-12 flex-1 cursor-pointer gap-1.5 font-display text-sm font-semibold uppercase tracking-wider'
              )}
            >
              <ArrowLeft className="size-4" strokeWidth={1.8} />
              Atrás
            </Button>
          )}

          {!isLast && (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canContinue(stepKey, draft)}
              className={cn(
                'h-12 flex-1 cursor-pointer gap-1.5 font-display text-sm font-semibold uppercase tracking-wider'
              )}
            >
              Continuar
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Button>
          )}

          {isLast && (
            <Button
              type="button"
              onClick={() => summarySaveRef.current()}
              disabled={summarySaving}
              className={cn(
                'h-12 flex-1 cursor-pointer gap-1.5 font-display text-sm font-semibold uppercase tracking-wider'
              )}
            >
              <CheckCircle2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {summarySaving ? 'Guardando…' : 'Guardar cotización'}
            </Button>
          )}
        </div>
      </div>

      {/* Advertencia de descarte — SIEMPRE antes de cancelar/cerrar el wizard */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Descartar esta cotización?</DialogTitle>
            <DialogDescription>Perderás lo que llevas.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmCancelOpen(false)}>
              Seguir editando
            </Button>
            <Button type="button" variant="destructive" onClick={discardQuote}>
              Descartar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
