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
      className="flex min-h-[3.25rem] w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="tile-blue grid size-8 shrink-0 place-items-center rounded-[0.55rem] text-white">
        <HelpCircle className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[1.0625rem]">Repetir tutorial guiado</span>
    </button>
  )
}
