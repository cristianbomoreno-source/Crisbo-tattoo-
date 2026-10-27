'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CashSummarySheet, type Receivable } from '@/components/home/cash-summary-sheet'
import { OPEN_CAJA_EVENT } from '@/components/home/open-caja-row'
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
 * que de alto) para no pelear con el scroll vertical. La entrada visible es
 * la tarjeta "Caja y cuentas" (la pestañita del borde se quitó a pedido).
 * `/dashboard?caja=1` (Estudio → Caja y cuentas) lo abre directo.
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(() => searchParams.get('caja') === '1')
  const start = useRef<{ x: number; y: number } | null>(null)

  // La fila "Caja y cuentas" de Inicio la abre con un evento.
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_CAJA_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CAJA_EVENT, onOpen)
  }, [])

  // Limpia `?caja=1` para que un refresh no vuelva a abrirlo.
  useEffect(() => {
    if (searchParams.get('caja') === '1') router.replace(pathname)
  }, [searchParams, router, pathname])

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

      <CashSummarySheet open={open} onOpenChange={setOpen} summary={summary} receivable={receivable} />
    </div>
  )
}
