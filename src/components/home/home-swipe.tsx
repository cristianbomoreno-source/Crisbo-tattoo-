'use client'

import { useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { CashSummarySheet, type Receivable } from '@/components/home/cash-summary-sheet'
import type { CashSummary } from '@/lib/finance/cash-summary'

/** Elementos que ya usan el gesto horizontal (carrusel de "Próxima sesión",
 * listas con scroll lateral, filas deslizables): ahí el swipe es suyo. */
function ownsHorizontalSwipe(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  while (el && el !== document.body) {
    if (el.hasAttribute('data-no-page-swipe')) return true
    if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1) {
      const ox = getComputedStyle(el).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
    el = el.parentElement
  }
  return false
}

/**
 * Inicio móvil: deslizar de derecha a izquierda abre el Resumen de caja.
 * Solo cuenta un gesto claramente horizontal (≥ 70px y el doble de largo
 * que de alto) para no pelear con el scroll vertical. La pestañita del
 * borde derecho hace lo mismo con un toque y deja ver que el gesto existe.
 */
export function HomeSwipe({
  children,
  summary,
  receivable,
}: {
  children: React.ReactNode
  summary: CashSummary
  receivable: Receivable
}) {
  const [open, setOpen] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0]
        start.current = t && e.touches.length === 1 && !ownsHorizontalSwipe(e.target) ? { x: t.clientX, y: t.clientY } : null
      }}
      onTouchEnd={(e) => {
        const s = start.current
        const t = e.changedTouches[0]
        start.current = null
        if (!s || !t) return
        const dx = t.clientX - s.x
        const dy = t.clientY - s.y
        if (dx <= -70 && Math.abs(dx) > Math.abs(dy) * 2) setOpen(true)
      }}
    >
      {children}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir resumen de caja"
        className="fixed right-0 top-1/2 z-20 flex h-14 w-4 -translate-y-1/2 items-center justify-center rounded-l-full bg-foreground/10 text-foreground/60 backdrop-blur md:hidden"
      >
        <ChevronLeft className="size-3.5" />
      </button>

      <CashSummarySheet open={open} onOpenChange={setOpen} summary={summary} receivable={receivable} />
    </div>
  )
}
