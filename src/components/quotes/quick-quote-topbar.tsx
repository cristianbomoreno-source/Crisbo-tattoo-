'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Barra superior + barra de progreso de Cotización Rápida. No es un
 * wizard secuencial (todas las secciones están visibles a la vez, sin
 * scroll en escritorio/iPad) — `completed` es cuántas de las 8 secciones
 * ya tienen algo cargado, así la barra avanza sola a medida que el
 * tatuador completa la cotización, sin obligarlo a navegar paso a paso.
 */
export function QuickQuoteTopBar({
  completed,
  total,
  onHelp,
}: {
  completed: number
  total: number
  onHelp?: () => void
}) {
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="sticky top-0 z-20 -mx-4 bg-[#050505]/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:static lg:rounded-t-[1.75rem] lg:border lg:border-b-0 lg:border-white/8 lg:pt-5">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          aria-label="Volver"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cb-icon.png" alt="Crisbo Tattoo" className="size-8 rounded-md" />
          <span className="hidden font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:inline">
            Cotización rápida
          </span>
        </div>

        <button
          type="button"
          onClick={onHelp}
          aria-label="Ayuda"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Paso {Math.min(completed + 1, total)} de {total}
        </span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className={cn('h-full rounded-full bg-primary')}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
        <span className="w-9 shrink-0 text-right font-display text-[11px] font-bold tabular-nums text-muted-foreground">
          {pct}%
        </span>
      </div>
    </div>
  )
}
