'use client'

import { ChevronDown } from 'lucide-react'

/** Flecha al final de cada sección de la landing de proyecto: un tap hace
 * scroll suave a la siguiente sección (le da fluidez al recorrido). */
export function SectionArrow({ targetId, color }: { targetId: string; color: string }) {
  function scrollToNext() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex justify-center pt-10">
      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Ir a la siguiente sección"
        className="flex size-11 items-center justify-center rounded-full border transition-transform active:scale-95"
        style={{ borderColor: `${color}55`, color }}
      >
        <ChevronDown className="size-5 animate-bounce" />
      </button>
    </div>
  )
}
