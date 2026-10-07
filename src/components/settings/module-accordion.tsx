'use client'

import { useState } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmbeddedSettingsProvider } from '@/components/settings/settings-subpage'

/**
 * Tarjeta-módulo desplegable del Centro de control: la flecha ya no navega —
 * DESPLIEGA el módulo completo dentro de la misma tarjeta, con los
 * formularios reales de Ajustes apilados (pasados como `panel` desde el
 * server component de la página, con sus datos ya cargados). Las filas de
 * estado siguen siendo links directos a las subpáginas de siempre para
 * quien prefiera la pantalla completa. `EmbeddedSettingsProvider` hace que
 * cada formulario suelte su marco de subpágina (sin flecha de volver,
 * título compacto, Guardar no-sticky) sin tocar los formularios.
 */
export function ModuleAccordion({
  icon: Icon,
  title,
  description,
  rows,
  panel,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  /** Filas de estado (links) siempre visibles. */
  rows: React.ReactNode
  /** Contenido desplegable: los formularios del módulo, apilados. */
  panel: React.ReactNode
  className?: string
}) {
  const [openPanel, setOpenPanel] = useState(false)

  return (
    <section
      className={cn(
        'relative flex flex-col rounded-[1.75rem] border border-border/60 bg-card p-5',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5.5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-title text-lg leading-tight uppercase">{title}</h2>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-0.5">{rows}</div>

      <button
        type="button"
        onClick={() => setOpenPanel((v) => !v)}
        aria-expanded={openPanel}
        aria-label={openPanel ? `Cerrar ${title}` : `Desplegar ${title}`}
        className="mt-3 grid size-9 place-items-center self-end rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown
          className={cn('size-4 transition-transform duration-200', openPanel && 'rotate-180')}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {openPanel && (
        <div className="mt-2 space-y-7 border-t border-border/60 pt-5">
          <EmbeddedSettingsProvider>{panel}</EmbeddedSettingsProvider>
        </div>
      )}
    </section>
  )
}
