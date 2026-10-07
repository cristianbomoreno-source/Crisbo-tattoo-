'use client'

import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BodyMapExplorer } from '@/components/intake/body-map-explorer'
import type { WizardDraft } from '@/components/quote-wizard/quote-wizard'

type StepZoneProps = {
  draft: WizardDraft
  patch: (patch: Partial<WizardDraft>) => void
}

/**
 * Paso 2 — Zona del cuerpo: mismo explorador anatómico del bot
 * (`BodyMapExplorer`, con las fotos reales de `public/body-map/`) en vez de
 * la silueta ilustrativa/chips de antes — así una cotización armada a mano
 * por el tatuador y una creada por el bot usan exactamente el mismo
 * vocabulario de zonas en `quotes.body_zone`. El género solo decide qué
 * fotos mostrar (no se guarda en la cotización, igual que en el bot).
 */
export function StepZone({ draft, patch }: StepZoneProps) {
  return (
    <div className="flex h-[calc(100dvh-23rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-96 flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
          <MapPin className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 pt-1">
          <h2 className="font-display text-base font-semibold uppercase tracking-wide">Zona del cuerpo</h2>
          <p className="text-sm text-muted-foreground">
            {draft.zone ? draft.zone : 'Recorré el cuerpo hasta la zona exacta'}
          </p>
        </div>
      </div>

      <div className="flex rounded-full border border-border bg-secondary p-1" role="group" aria-label="Referencia">
        {(['Hombre', 'Mujer'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => patch({ gender: g })}
            aria-pressed={(draft.gender ?? 'Hombre') === g}
            className={cn(
              'flex-1 cursor-pointer rounded-full py-2 font-display text-[clamp(0.62rem,2.8vw,0.75rem)] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              (draft.gender ?? 'Hombre') === g
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* `overflow-y-auto`: red de seguridad — si el cálculo de altura de
          arriba se queda corto en algún dispositivo (notch/isla dinámica
          más grande de lo estimado), el contenido se desliza DENTRO de esta
          caja en vez de desbordarse detrás del footer sticky. */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-secondary/40 p-3">
        <BodyMapExplorer gender={draft.gender ?? 'Hombre'} onDone={(label) => patch({ zone: label })} />
      </div>
    </div>
  )
}
