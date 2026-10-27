'use client'

import { createContext, useContext } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Contexto de embebido: cuando un formulario de Ajustes se renderiza DENTRO
 * de un módulo desplegable del Centro de control (module-accordion.tsx), el
 * marco de subpágina sobra — sin flecha de volver, título compacto, y la
 * barra Guardar deja de ser sticky. Los formularios no cambian: siguen
 * envolviéndose en <SettingsSubpage> como siempre, y este decide solo.
 */
const EmbeddedSettingsContext = createContext(false)

export function EmbeddedSettingsProvider({ children }: { children: React.ReactNode }) {
  return <EmbeddedSettingsContext.Provider value={true}>{children}</EmbeddedSettingsContext.Provider>
}

/** Marco de una sub-pantalla de Ajustes: header con back al hub + título +
 * contenido en columna centrada (max-w-xl, no queda gigante en lg+). En modo
 * embebido (ver EmbeddedSettingsProvider) se reduce a un título pequeño. */
export function SettingsSubpage({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  const embedded = useContext(EmbeddedSettingsContext)

  if (embedded) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-[1.0625rem] font-semibold text-foreground">
            {title}
          </h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    )
  }

  return (
    // `pb-24`: reserva el espacio que antes ocupaba la barra Guardar cuando
    // era `sticky` (ver nota en SettingsSaveBar) — ahora que es `fixed` ya no
    // empuja contenido dentro del flujo normal, así que si no se reserva acá
    // la última tarjeta del formulario queda justo detrás de la barra.
    <div className="mx-auto max-w-xl pb-24 lg:pb-0">
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          aria-label="Volver a Estudio"
          className="mb-3 inline-flex h-10 items-center gap-1 rounded-full bg-secondary pr-4 pl-2.5 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft className="size-5" strokeWidth={2.2} aria-hidden="true" />
          Estudio
        </Link>
        <h1 className="large-title">{title}</h1>
        {description && <p className="mt-1 text-[1.0625rem] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/** Barra Guardar (deshabilitada sin cambios). En subpágina es `fixed`; el
 * offset inferior deja la barra ENCIMA de la navegación fija del móvil
 * (64px + safe-area) — antes era `bottom-0` y quedaba exactamente DEBAJO de
 * la barra de pestañas: el botón se veía a medias o nada y los taps caían en
 * la navegación, por eso "Guardar no hacía nada". El offset es 80px (8px de
 * margen + 64px de barra + 8px de aire). En desktop (lg, sin barra
 * inferior) vuelve a bottom-0. En modo
 * embebido no es fixed.
 *
 * Por qué `fixed` y no `sticky`: reportado como bug real ("Guardar no deja
 * ver los mensajes al escribir en las plantillas de WhatsApp"). Con el
 * teclado en pantalla, Safari/iOS reduce el viewport VISUAL y hace scroll
 * para mostrar el campo enfocado dentro de esa área más chica, pero
 * `position: sticky` se sigue calculando contra el viewport de LAYOUT (el
 * tamaño completo, sin descontar el teclado) — la barra terminaba flotando
 * a mitad de pantalla, tapando justo el textarea que se estaba editando.
 * `position: fixed` sí se recalcula contra el viewport visual en Safari
 * moderno (por eso `mobile-nav.tsx`, `install-prompt.tsx`, `page-hint.tsx` y
 * el footer de `quote-wizard.tsx` — todos `fixed` — no tienen este problema).
 * `SettingsSubpage` ahora reserva `pb-24` para compensar que la barra ya no
 * empuja contenido dentro del flujo normal. */
export function SettingsSaveBar({
  dirty,
  saving,
  onSave,
  label = 'Guardar',
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  label?: string
}) {
  const embedded = useContext(EmbeddedSettingsContext)
  if (embedded) {
    return (
      <div className="mt-6 border-t border-border pt-3">
        <Button type="button" onClick={onSave} disabled={!dirty || saving} className="h-10 w-full sm:w-auto">
          {saving ? 'Guardando…' : label}
        </Button>
      </div>
    )
  }
  return (
    <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 px-4 py-2 sm:px-6 lg:bottom-4 lg:left-[16.5rem]">
      <div className="mx-auto max-w-xl">
        <Button type="button" onClick={onSave} disabled={!dirty || saving} className="h-12 w-full text-[1.0625rem] shadow-[0_10px_30px_-8px_rgb(0_0_0/0.6)]">
          {saving ? 'Guardando…' : label}
        </Button>
      </div>
    </div>
  )
}
