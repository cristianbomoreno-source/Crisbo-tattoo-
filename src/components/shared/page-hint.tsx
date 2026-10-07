'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { findPageHint, HINT_SEEN_PREFIX, TOUR_DONE_KEY } from '@/lib/tutorial-content'

/**
 * Banner discreto y descartable que explica la sección actual, la primera
 * vez que se visita esa ruta. Solo aparece una vez terminado el recorrido
 * inicial (`onboarding-tour.tsx`), para no apilar dos overlays a la vez.
 * Un flag por sección en localStorage evita repetirlo.
 */
export function PageHint() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState<{ key: string; title: string; body: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(TOUR_DONE_KEY) !== '1') return

    const hint = findPageHint(pathname)
    if (!hint) {
      setVisible(false)
      return
    }
    const seenKey = `${HINT_SEEN_PREFIX}${hint.key}`
    if (window.localStorage.getItem(seenKey) === '1') {
      setVisible(false)
      return
    }
    setContent({ key: hint.key, title: hint.step.title, body: hint.step.body })
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [pathname])

  function dismiss() {
    if (content) window.localStorage.setItem(`${HINT_SEEN_PREFIX}${content.key}`, '1')
    setVisible(false)
  }

  if (!visible || !content) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(106px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in lg:bottom-6 lg:left-64">
      <div className="relative flex w-full max-w-sm items-start gap-3 rounded-2xl bg-card p-3.5 pr-9 shadow-xl ring-1 ring-border/60">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
            {content.title}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{content.body}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Entendido, no volver a mostrar"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
