'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tourStepsFor, OPEN_TOUR_EVENT, type TourStep, type TourKey } from '@/lib/tour/tour-config'
import { TOUR_DONE_KEY } from '@/lib/tutorial-content'
import {
  getMyTourProgress,
  advanceTourProgress,
  finishTourProgress,
  skipTourProgress,
} from '@/actions/tour'

const CARD_MARGIN = 16
const SPOTLIGHT_PAD = 8
/** Cuánto espera, como máximo, a que el elemento del paso aparezca en el
 * DOM (tras navegar de pantalla o al montar) antes de omitir el paso
 * solo — nunca bloquea el recorrido por un elemento que no existe. */
const TARGET_WAIT_MS = 2600
const POLL_MS = 80

type Rect = { top: number; left: number; width: number; height: number }

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Primer elemento visible (en pantalla, con tamaño real) que calce con
 * alguno de los `data-tour` candidatos, en orden de preferencia. Así una
 * misma versión del paso sirve para el equivalente móvil Y de escritorio
 * de una función (p. ej. pulpo vs. botón de escritorio). */
function findVisibleTarget(keys: string[]): HTMLElement | null {
  for (const key of keys) {
    const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)
    for (const el of candidates) {
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      // Fuera de flujo visible (display:none vía breakpoint, ej. lg:hidden).
      if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') continue
      return el
    }
  }
  return null
}

function waitForTarget(keys: string[], timeoutMs: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const found = findVisibleTarget(keys)
      if (found) return resolve(found)
      if (Date.now() - start >= timeoutMs) return resolve(null)
      setTimeout(tick, POLL_MS)
    }
    tick()
  })
}

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto'

function computeCardStyle(
  rect: Rect,
  placement: Placement,
  cardSize: { w: number; h: number }
): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const order: Exclude<Placement, 'auto'>[] =
    placement === 'top'
      ? ['top', 'bottom', 'right', 'left']
      : placement === 'left'
        ? ['left', 'right', 'bottom', 'top']
        : placement === 'right'
          ? ['right', 'left', 'bottom', 'top']
          : ['bottom', 'top', 'right', 'left']

  const gap = 14
  for (const dir of order) {
    let top = 0
    let left = 0
    if (dir === 'bottom') {
      top = rect.top + rect.height + gap
      left = rect.left + rect.width / 2 - cardSize.w / 2
      if (top + cardSize.h > vh - CARD_MARGIN) continue
    } else if (dir === 'top') {
      top = rect.top - gap - cardSize.h
      left = rect.left + rect.width / 2 - cardSize.w / 2
      if (top < CARD_MARGIN) continue
    } else if (dir === 'right') {
      top = rect.top + rect.height / 2 - cardSize.h / 2
      left = rect.left + rect.width + gap
      if (left + cardSize.w > vw - CARD_MARGIN) continue
    } else {
      top = rect.top + rect.height / 2 - cardSize.h / 2
      left = rect.left - gap - cardSize.w
      if (left < CARD_MARGIN) continue
    }
    return {
      top: Math.min(Math.max(top, CARD_MARGIN), vh - cardSize.h - CARD_MARGIN),
      left: Math.min(Math.max(left, CARD_MARGIN), vw - cardSize.w - CARD_MARGIN),
    }
  }
  // Ningún lado alcanza: se ancla abajo, centrada y recortada al viewport
  // (siempre visible, aunque no quede pegada al elemento).
  return {
    top: Math.min(Math.max(rect.top + rect.height + gap, CARD_MARGIN), vh - cardSize.h - CARD_MARGIN),
    left: Math.min(Math.max(vw / 2 - cardSize.w / 2, CARD_MARGIN), vw - cardSize.w - CARD_MARGIN),
  }
}

/**
 * Tutorial guiado interactivo de OFINK. Recorrido distinto según el tipo
 * de cuenta (`tour-config.ts`): oscurece la pantalla, resalta con un
 * spotlight real el elemento `data-tour` del paso actual, navega solo
 * entre pantallas cuando el paso lo requiere, y guarda el progreso en
 * Supabase (`tour_progress`) para poder continuar donde quedó.
 *
 * Se auto-abre SOLO para cuentas nuevas (progreso en estado 'pending' —
 * ver `initTourProgress`, llamado al crear la cuenta). Se puede volver a
 * abrir en cualquier momento desde Ajustes → Ayuda, que dispara
 * `OPEN_TOUR_EVENT` — este componente vive montado globalmente en
 * `AppShell`, así que reabre sin importar la pantalla.
 */
export function GuidedTour() {
  const router = useRouter()
  const pathname = usePathname()

  const [tourKey, setTourKey] = useState<TourKey | null>(null)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null)
  const [loadingStep, setLoadingStep] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const targetElRef = useRef<HTMLElement | null>(null)
  const generationRef = useRef(0)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion()
  }, [])

  // Carga inicial: solo se auto-abre si el progreso guardado dice 'pending'
  // (cuenta creada después de este feature, primera vez que entra).
  useEffect(() => {
    let cancelled = false
    getMyTourProgress().then((res) => {
      if (cancelled || !res.success) return
      setTourKey(res.data.tourKey)
      setSteps(tourStepsFor(res.data.tourKey))
      if (res.data.status === 'pending') {
        setStepIndex(0)
        const t = setTimeout(() => setOpen(true), 700)
        return () => clearTimeout(t)
      }
    })
    return () => {
      cancelled = true
    }
     
  }, [])

  // Reapertura manual desde Ajustes → Ayuda (siempre arranca en el paso 0).
  useEffect(() => {
    function onReplay() {
      getMyTourProgress().then((res) => {
        const key = res.success ? res.data.tourKey : tourKey ?? 'tatuador'
        setTourKey(key)
        setSteps(tourStepsFor(key))
        setStepIndex(0)
        setOpen(true)
      })
    }
    window.addEventListener(OPEN_TOUR_EVENT, onReplay)
    return () => window.removeEventListener(OPEN_TOUR_EVENT, onReplay)
     
  }, [tourKey])

  const measure = useCallback(() => {
    const el = targetElRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [])

  // Recalcula la posición del spotlight/tarjeta al hacer scroll o resize
  // (teclado de iOS abriéndose, rotación de pantalla, etc.) — nunca queda
  // desalineado del elemento real.
  useEffect(() => {
    if (!open || !rect) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, rect, measure])

  useEffect(() => {
    if (!rect) return
    const card = cardRef.current
    const size = card ? { w: card.offsetWidth, h: card.offsetHeight } : { w: 340, h: 220 }
    const placement = steps[stepIndex]?.target?.placement ?? 'auto'
    setCardPos(computeCardStyle(rect, placement, size))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, stepIndex])

  // Muestra el paso actual: navega si hace falta, espera (con límite) a
  // que el elemento exista y sea visible, mide su posición o —si nunca
  // aparece— salta solo al siguiente paso sin bloquear el recorrido.
  const showStep = useCallback(
    async (index: number, direction: 1 | -1) => {
      const myGen = ++generationRef.current
      if (index < 0) return
      if (index >= steps.length) {
        finishTourProgress()
        if (typeof window !== 'undefined') window.localStorage.setItem(TOUR_DONE_KEY, '1')
        setOpen(false)
        return
      }

      // `index` ya pasó los guards de arriba (`< 0` y `>= steps.length`),
      // así que cae dentro de rango.
      const step = steps[index]!
      setLoadingStep(true)
      setRect(null)
      targetElRef.current = null

      if (step.route && step.route !== pathname) {
        router.push(step.route)
      }

      if (!step.target) {
        // Paso flotante (bienvenida/cierre): pequeña espera para que la
        // navegación (si hubo) asiente antes de mostrar la tarjeta centrada.
        await new Promise((r) => setTimeout(r, step.route && step.route !== pathname ? 380 : 0))
        if (generationRef.current !== myGen) return
        setStepIndex(index)
        setLoadingStep(false)
        advanceTourProgress(index)
        return
      }

      const el = await waitForTarget(step.target.keys, TARGET_WAIT_MS)
      if (generationRef.current !== myGen) return

      if (!el) {
        // El elemento no existe en esta cuenta/pantalla — se omite solo.
        showStep(index + direction, direction)
        return
      }

      targetElRef.current = el
      el.scrollIntoView({
        behavior: reducedMotionRef.current ? 'auto' : 'smooth',
        block: 'center',
        inline: 'center',
      })
      // Deja que el scroll asiente antes de medir la posición final.
      await new Promise((r) => setTimeout(r, reducedMotionRef.current ? 0 : 260))
      if (generationRef.current !== myGen) return

      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      setStepIndex(index)
      setLoadingStep(false)
      advanceTourProgress(index)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, pathname]
  )

  useEffect(() => {
    if (!open || steps.length === 0) return
    showStep(stepIndex, 1)
    // Solo al abrir — los siguientes pasos los dispara handleNext/handleBack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    cardRef.current?.focus()
  }, [stepIndex, open, loadingStep])

  function close(status: 'skipped') {
    generationRef.current++
    skipTourProgress()
    if (typeof window !== 'undefined') window.localStorage.setItem(TOUR_DONE_KEY, '1')
    setOpen(false)
    void status
  }

  function handleNext() {
    if (loadingStep) return
    showStep(stepIndex + 1, 1)
  }
  function handleBack() {
    if (loadingStep || stepIndex === 0) return
    showStep(stepIndex - 1, -1)
  }

  // Navegación por teclado: Esc omite, flechas avanzan/retroceden.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close('skipped')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleBack()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex, loadingStep])

  if (!open || steps.length === 0) return null

  // `stepIndex` solo se fija (0 al abrir/reabrir, o vía `showStep`, que ya
  // valida sus propios límites) mientras `steps` tiene ese índice — nunca
  // queda apuntando fuera de rango mientras `open` es true.
  const step = steps[stepIndex]!
  const total = steps.length
  const isLast = stepIndex === total - 1
  const hasSpotlight = !!step.target && !!rect
  const reduced = reducedMotionRef.current

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      {/* Desenfoca todo menos el elemento señalado (spec: "el resto tenga
          desenfoque", el elemento debe verse tal cual la app lo muestra).
          Sin spotlight (bienvenida/cierre): desenfoca la pantalla entera. */}
      {hasSpotlight && rect ? (
        <>
          {(() => {
            const top = rect.top - SPOTLIGHT_PAD
            const left = rect.left - SPOTLIGHT_PAD
            const width = rect.width + SPOTLIGHT_PAD * 2
            const height = rect.height + SPOTLIGHT_PAD * 2
            const blurCls = cn(
              'absolute bg-black/45 backdrop-blur-md',
              !reduced && 'transition-all duration-300 ease-out'
            )
            return (
              <>
                <div className={blurCls} style={{ top: 0, left: 0, right: 0, height: Math.max(top, 0) }} onClick={() => close('skipped')} aria-hidden="true" />
                <div className={blurCls} style={{ top: top + height, left: 0, right: 0, bottom: 0 }} onClick={() => close('skipped')} aria-hidden="true" />
                <div className={blurCls} style={{ top, left: 0, width: Math.max(left, 0), height }} onClick={() => close('skipped')} aria-hidden="true" />
                <div className={blurCls} style={{ top, left: left + width, right: 0, height }} onClick={() => close('skipped')} aria-hidden="true" />
                {/* Hueco: sin desenfoque ni tinte — el elemento se ve exactamente como en la app. */}
                <div
                  className={cn(!reduced && 'transition-all duration-300 ease-out')}
                  style={{ position: 'absolute', top, left, width, height, cursor: 'pointer' }}
                  onClick={() => close('skipped')}
                  aria-hidden="true"
                />
              </>
            )
          })()}
        </>
      ) : (
        <div
          className={cn('absolute inset-0 bg-black/45 backdrop-blur-md', !reduced && 'transition-opacity duration-300')}
          aria-hidden="true"
          onClick={() => close('skipped')}
        />
      )}

      {hasSpotlight && rect && (
        <div
          aria-hidden="true"
          className={cn('pointer-events-none fixed rounded-2xl', !reduced && 'transition-all duration-300 ease-out')}
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: '0 0 0 2.5px var(--primary), 0 0 24px rgba(184,244,0,0.35)',
          }}
        />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial de OFINK, paso ${stepIndex + 1} de ${total}: ${step.title}`}
        className={cn(
          'fixed w-[calc(100vw-2rem)] max-w-sm rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-2xl outline-none sm:p-6',
          !reduced && 'transition-[top,left] duration-300 ease-out',
          !hasSpotlight && 'inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2'
        )}
        style={hasSpotlight && cardPos ? { top: cardPos.top, left: cardPos.left } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
            Paso {stepIndex + 1} de {total}
          </span>
          <button
            type="button"
            onClick={() => close('skipped')}
            aria-label="Cerrar tutorial"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <h2 className="mt-3 font-title text-xl uppercase leading-tight">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => close('skipped')}
            className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Omitir
          </button>

          <div className="ml-auto flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loadingStep}
                aria-label="Paso anterior"
                className="flex items-center gap-1 rounded-full border border-border/60 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loadingStep}
              className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {isLast ? 'Empezar a usar OFINK' : 'Siguiente'}
              {!isLast && <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-border'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
