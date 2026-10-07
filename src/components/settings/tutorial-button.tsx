'use client'

import { HelpCircle } from 'lucide-react'
import { OPEN_TOUR_EVENT } from '@/lib/tour/tour-config'
import { restartTourProgress } from '@/actions/tour'

/**
 * Ajustes → Ayuda → "Repetir tutorial": reabre el recorrido guiado con
 * spotlight (`GuidedTour`) desde el paso 0, sin importar en qué pantalla
 * esté la persona — el tour vive montado globalmente en `AppShell` y
 * escucha `OPEN_TOUR_EVENT`. `restartTourProgress` dejó el progreso
 * guardado en 'in_progress'/paso 0 antes de disparar el evento, así que
 * si cierra la app a medias puede seguir donde quedó la próxima vez.
 */
export function TutorialButton() {
  function handleClick() {
    restartTourProgress()
    window.dispatchEvent(new Event(OPEN_TOUR_EVENT))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex min-h-9 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <HelpCircle className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">Repetir tutorial guiado</span>
    </button>
  )
}
