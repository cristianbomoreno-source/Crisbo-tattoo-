'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DotsSixVertical } from '@phosphor-icons/react'
import { reorderAccountsAction } from '@/actions/studio'
import { NO_ACCOUNT, type AccountBalance } from '@/lib/finance/cash-summary'

/**
 * Lista de cuentas de Caja que se ordena arrastrando la agarradera (⋮⋮) de
 * cada tarjeta — funciona con el dedo y con el mouse. Al soltar se guarda el
 * orden en los medios de pago del estudio, que es el orden en que salen las
 * cuentas en toda la app (Caja, cobros, atajo del iPhone).
 */
export function SortableAccounts({
  items,
  allNames,
  render,
}: {
  items: AccountBalance[]
  /** Todas las cuentas conocidas (también las que no se muestran), para no perderlas al guardar. */
  allNames: string[]
  render: (account: AccountBalance, handle: React.ReactNode) => React.ReactNode
}) {
  const router = useRouter()
  const [order, setOrder] = useState(() => items.map((a) => a.name))
  const [drag, setDrag] = useState<{ name: string; dy: number; y: number; from: number; heights: number[] } | null>(null)
  const [, startTransition] = useTransition()
  const refs = useRef(new Map<string, HTMLDivElement>())

  // Si llegan cuentas nuevas del servidor, se agregan al final sin perder el orden local.
  const names = [...order.filter((n) => items.some((a) => a.name === n)), ...items.map((a) => a.name).filter((n) => !order.includes(n))]
  const byName = new Map(items.map((a) => [a.name, a]))

  function targetIndex(dy: number) {
    const s = drag
    if (!s) return 0
    let i = s.from
    let acc = 0
    if (dy > 0) {
      while (i < s.heights.length - 1 && dy > acc + s.heights[i + 1]! / 2) acc += s.heights[++i]!
    } else {
      while (i > 0 && -dy > acc + s.heights[i - 1]! / 2) acc += s.heights[--i]!
    }
    return i
  }

  function onDown(e: React.PointerEvent, name: string) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const heights = names.map((n) => (refs.current.get(n)?.getBoundingClientRect().height ?? 0) + 8)
    setDrag({ name, dy: 0, y: e.clientY, from: names.indexOf(name), heights })
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return
    setDrag({ ...drag, dy: e.clientY - drag.y })
  }

  function onUp() {
    if (!drag) return
    const from = drag.from
    const to = targetIndex(drag.dy)
    setDrag(null)
    if (from === to) return
    const next = [...names]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved!)
    setOrder(next)
    const full = [...next, ...allNames.filter((n) => !next.includes(n))].filter((n) => n !== NO_ACCOUNT)
    startTransition(async () => {
      const res = await reorderAccountsAction(full)
      if (!res.success) {
        setOrder(names)
        toast.error(res.error.message)
        return
      }
      router.refresh()
    })
  }

  // Desplazamiento visual de las demás tarjetas mientras se arrastra una.
  function offsetFor(name: string) {
    if (!drag) return 0
    if (name === drag.name) return drag.dy
    const from = drag.from
    const to = targetIndex(drag.dy)
    const i = names.indexOf(name)
    const h = drag.heights[from]!
    if (from < to && i > from && i <= to) return -h
    if (from > to && i >= to && i < from) return h
    return 0
  }

  return (
    <div className="space-y-2">
      {names.map((name) => {
        const a = byName.get(name)
        if (!a) return null
        const dragging = drag?.name === name
        return (
          <div
            key={name}
            ref={(el) => {
              if (el) refs.current.set(name, el)
              else refs.current.delete(name)
            }}
            style={{ transform: `translateY(${offsetFor(name)}px)` }}
            className={dragging ? 'relative z-10 scale-[1.02] shadow-[0_16px_40px_-12px_rgb(0_0_0/0.6)] transition-[scale,box-shadow]' : 'transition-transform duration-200 ease-out'}
          >
            {render(
              a,
              <button
                type="button"
                aria-label={`Arrastrar para ordenar ${name}`}
                onPointerDown={(e) => onDown(e, name)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className="absolute top-1/2 right-2 z-10 grid size-10 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-full text-muted-foreground active:cursor-grabbing active:bg-foreground/10"
              >
                <DotsSixVertical className="size-6" weight="bold" />
              </button>,
            )}
          </div>
        )
      })}
    </div>
  )
}
