'use client'

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const REVEAL_WIDTH = 84
/** Con solo 28px de arrastre al soltar, la fila termina de abrirse sola. */
const OPEN_THRESHOLD = 28

/**
 * Coordina que solo una fila del grupo esté "abierta" (revelando Eliminar) a
 * la vez, y cierra la abierta al hacer scroll vertical de la página — igual
 * que Mail/Recordatorios de iOS.
 */
const SwipeGroupContext = createContext<{
  openId: string | null
  setOpenId: (id: string | null) => void
} | null>(null)

export function SwipeToDeleteGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (!openId) return
    const close = () => setOpenId(null)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', close, { capture: true })
  }, [openId])

  return <SwipeGroupContext.Provider value={{ openId, setOpenId }}>{children}</SwipeGroupContext.Provider>
}

/**
 * Swipe-to-delete estilo iOS sobre SCROLL HORIZONTAL NATIVO (el navegador
 * arbitra horizontal vs. vertical con su motor táctil — por eso nunca queda
 * una fila abierta por accidente al hacer scroll de la lista), pero SIN
 * scroll-snap: con `snap-mandatory` y un recorrido de apenas 84px, iOS exigía
 * un latigazo decidido para vencer el imán del snap y el gesto se sentía duro
 * ("no desliza fácil"). Ahora el dedo arrastra libre y con fricción nativa, y
 * el asentamiento lo decide este componente al soltar: si el arrastre pasó de
 * `OPEN_THRESHOLD` (28px, umbral bajo a propósito), la fila termina de
 * abrirse sola con animación suave; si no, se cierra. El asentamiento espera
 * a que el dedo se levante Y a que pare la inercia (timer que se reinicia con
 * cada evento de scroll) — nunca pelea contra el gesto en curso.
 */
export function SwipeToDeleteRow({
  children,
  onDelete,
  deleteLabel = 'Eliminar',
  disabled,
  className,
}: {
  children: React.ReactNode
  onDelete: () => void
  deleteLabel?: string
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const group = useContext(SwipeGroupContext)
  const trackRef = useRef<HTMLDivElement>(null)
  const isOpen = useRef(false)
  const touching = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scrollTo(left: number, smooth = true) {
    trackRef.current?.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
  }

  function setOpen(open: boolean) {
    if (open === isOpen.current) return
    isOpen.current = open
    if (open) group?.setOpenId(id)
    else if (group?.openId === id) group.setOpenId(null)
  }

  function settle() {
    const x = trackRef.current?.scrollLeft ?? 0
    // Si venía cerrada, abrir con poquito arrastre (umbral bajo); si venía
    // abierta, cerrarla también con poquito (simétrico, se siente natural).
    const target = isOpen.current
      ? x < REVEAL_WIDTH - OPEN_THRESHOLD
        ? 0
        : REVEAL_WIDTH
      : x > OPEN_THRESHOLD
        ? REVEAL_WIDTH
        : 0
    setOpen(target === REVEAL_WIDTH)
    if (Math.abs(x - target) > 1) scrollTo(target)
  }

  function scheduleSettle(delay: number) {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null
      if (!touching.current) settle()
    }, delay)
  }

  // Otra fila del grupo se abrió (o hubo scroll de página): esta se cierra.
  useEffect(() => {
    if (!group) return
    if (group.openId !== id && isOpen.current) {
      isOpen.current = false
      scrollTo(0)
    }
  }, [group, group?.openId, id])

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

  return (
    <div className={cn('relative isolate overflow-hidden rounded-2xl', className)}>
      <div
        ref={trackRef}
        onTouchStart={() => {
          touching.current = true
          if (settleTimer.current) clearTimeout(settleTimer.current)
        }}
        onTouchEnd={() => {
          touching.current = false
          scheduleSettle(60)
        }}
        onTouchCancel={() => {
          touching.current = false
          scheduleSettle(60)
        }}
        // Cada evento de scroll (dedo o inercia) reinicia el timer: settle()
        // corre solo cuando el carril lleva un momento quieto y sin dedo.
        onScroll={() => {
          if (!touching.current) scheduleSettle(80)
        }}
        className={cn(
          'ofink-no-scrollbar flex overflow-x-auto overscroll-x-contain',
          disabled && 'overflow-x-hidden'
        )}
      >
        <div
          className="w-full shrink-0"
          onClickCapture={(e) => {
            // Con la fila abierta, un tap sobre el contenido la cierra (como
            // en iOS) en vez de abrir el detalle.
            if (isOpen.current || (trackRef.current?.scrollLeft ?? 0) > 4) {
              e.preventDefault()
              e.stopPropagation()
              setOpen(false)
              scrollTo(0)
            }
          }}
        >
          {children}
        </div>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setOpen(false)
            scrollTo(0, false)
            onDelete()
          }}
          aria-label={deleteLabel}
          style={{ width: REVEAL_WIDTH }}
          className="flex shrink-0 flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground"
        >
          <Trash2 className="size-5" strokeWidth={2} />
          <span className="text-[11px] font-medium">Eliminar</span>
        </button>
      </div>
    </div>
  )
}
