'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export type LightboxPhoto = { id: string; url: string; caption?: string | null }

/**
 * Visor de galería a pantalla completa: se abre en una foto puntual y se
 * desliza (swipe) hacia los lados para cambiar de foto, igual que el
 * visor nativo de fotos. Usa scroll-snap horizontal (nativo del navegador,
 * sin drag handlers propios) para que el gesto se sienta 1:1 con el dedo
 * en iPhone. `openIndex` reposiciona el scroll cada vez que se abre en una
 * foto distinta.
 */
export function GalleryLightbox({
  photos,
  openIndex,
  onClose,
}: {
  photos: LightboxPhoto[]
  /** Índice de la foto a mostrar primero, o null si está cerrado. */
  openIndex: number | null
  onClose: () => void
}) {
  const open = openIndex !== null
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(openIndex ?? 0)

  // Al abrir (o cambiar de foto de entrada), saltar sin animación a esa
  // posición -- si se anima, se ve un swipe fantasma por todas las fotos
  // de en medio.
  useEffect(() => {
    if (openIndex === null) return
    setCurrent(openIndex)
    const el = scrollerRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTo({ left: openIndex * el.clientWidth, behavior: 'auto' })
    })
  }, [openIndex])

  function handleScroll() {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setCurrent(idx)
  }

  function goTo(idx: number) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="h-dvh max-h-dvh w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 bg-black p-0 sm:h-[90vh] sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">Galería de fotos</DialogTitle>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <X className="size-4.5" strokeWidth={2} />
        </button>

        {photos.length > 1 && (
          <span className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {current + 1} / {photos.length}
          </span>
        )}

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((p) => (
            <div key={p.id} className="relative h-full w-full shrink-0 snap-center snap-always">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ''}
                className="size-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(Math.max(0, current - 1))}
              disabled={current === 0}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-0 sm:grid"
            >
              <ChevronLeft className="size-5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => goTo(Math.min(photos.length - 1, current + 1))}
              disabled={current === photos.length - 1}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-0 sm:grid"
            >
              <ChevronRight className="size-5" strokeWidth={2.2} />
            </button>
          </>
        )}

        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {photos.map((p, i) => (
              <span
                key={p.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
