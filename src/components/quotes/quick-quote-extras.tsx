'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'motion/react'
import { Check, Grid3x3, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cop } from '@/lib/projects/metrics'
import { styleRender } from '@/lib/body-render-assets'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

/** Número grande del precio total, con conteo animado cada vez que cambia
 * (presets marcados, precio editado a mano). Sin librerías nuevas: usa los
 * primitivos de `motion/react` que ya trae el proyecto. */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration: 0.45,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
     
  }, [value])

  useEffect(() => {
    mv.set(display)
  }, [display, mv])

  return <span className={className}>{cop(display)}</span>
}

const STYLE_TILE_LIMIT = 3

/**
 * Selector de estilo en grilla (reemplaza al carrusel horizontal en esta
 * pantalla) — selección MÚLTIPLE: se pueden marcar varias tarjetas a la
 * vez. Muestra los primeros `STYLE_TILE_LIMIT` estilos del estudio como
 * tarjetas grandes con fotografía y una tarjeta final "Ver más" que abre
 * el resto en un popup. Guarda `style: string[]` — se unen con ", " al
 * mandar la cotización, sin tocar el esquema (`quotes.style` sigue siendo
 * un solo texto).
 */
export function StyleGridPicker({
  styles,
  value,
  onChange,
  disabled,
}: {
  styles: string[]
  value: string[]
  onChange: (styles: string[]) => void
  disabled?: boolean
}) {
  const [seeAllOpen, setSeeAllOpen] = useState(false)
  const featured = styles.slice(0, STYLE_TILE_LIMIT)
  const rest = styles.slice(STYLE_TILE_LIMIT)
  // Los estilos elegidos que no estén entre los destacados (se eligieron
  // desde "Ver más") se muestran igual, para que la selección nunca
  // "desaparezca" de la vista principal.
  const extraSelected = value.filter((s) => !featured.includes(s))
  const tiles = [...extraSelected, ...featured]

  function pick(style: string) {
    onChange(value.includes(style) ? value.filter((s) => s !== style) : [...value, style])
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((style) => (
          <StyleTile key={style} style={style} active={value.includes(style)} onClick={() => pick(style)} disabled={disabled} />
        ))}
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setSeeAllOpen(true)}
            disabled={disabled}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Grid3x3 className="size-5" strokeWidth={1.8} aria-hidden="true" />
            <span className="font-display text-[11px] font-semibold uppercase tracking-wide">Ver más</span>
          </button>
        )}
      </div>

      <Dialog open={seeAllOpen} onOpenChange={setSeeAllOpen}>
        <DialogContent className="max-h-[80dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos los estilos</DialogTitle>
            <DialogDescription>Elige uno o varios para la cotización.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {styles.map((style) => (
              <StyleTile key={style} style={style} active={value.includes(style)} onClick={() => pick(style)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StyleTile({
  style,
  active,
  onClick,
  disabled,
}: {
  style: string
  active?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  const render = styleRender(style)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={{ scale: active ? 1.03 : 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'group relative flex aspect-square flex-col overflow-hidden rounded-2xl border bg-black text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-primary shadow-[0_0_0_1px_rgba(184,244,0,0.3),0_10px_28px_-10px_rgba(184,244,0,0.45)]'
          : 'border-white/10 hover:border-primary/40'
      )}
    >
      {render ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={render} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" aria-hidden="true" />
      {active && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        </motion.span>
      )}
      <span
        className={cn(
          'relative mt-auto px-2.5 py-2 font-display text-[11px] font-bold uppercase leading-tight tracking-wide',
          active ? 'text-primary' : 'text-white'
        )}
      >
        {style}
      </span>
    </motion.button>
  )
}

export type SummaryData = {
  styleThumb: string | null
  styleLabel: string | null
  zoneLabel: string | null
  sizeLabel: string | null
  sessionLabel: string | null
  price: number
}

/**
 * Barra inferior fija con el resumen en tiempo real de la cotización y el
 * CTA principal — visible siempre, en las tres resoluciones (en escritorio
 * queda dentro del layout de dos columnas, no flotando sobre el sidebar).
 */
export function QuickQuoteSummaryBar({
  data,
  ctaLabel,
  ctaDisabled,
  onCta,
}: {
  data: SummaryData
  ctaLabel: string
  ctaDisabled?: boolean
  onCta: () => void
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-white/8 bg-[#050505]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-[1.75rem] lg:border">
      <div className="flex items-center gap-3">
        <div className="hidden min-w-0 flex-1 items-center gap-4 sm:flex">
          <SummaryChip label="Estilo" value={data.styleLabel ?? '—'} thumb={data.styleThumb} />
          <SummaryChip label="Zona" value={data.zoneLabel ?? '—'} />
          <SummaryChip label="Sesiones" value={data.sessionLabel ?? '—'} />
          <SummaryChip label="Precio" value={data.price > 0 ? cop(data.price) : '—'} emphasis />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
          <span className="truncate font-display text-sm font-bold text-primary tabular-nums">
            {data.price > 0 ? cop(data.price) : '—'}
          </span>
        </div>

        <button
          type="button"
          onClick={onCta}
          disabled={ctaDisabled}
          className="glow-primary flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ctaLabel}
          <ArrowRight className="size-4" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function SummaryChip({
  label,
  value,
  thumb,
  emphasis,
}: {
  label: string
  value: string
  thumb?: string | null
  emphasis?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm font-semibold', emphasis ? 'text-primary' : 'text-foreground')}>{value}</p>
      </div>
    </div>
  )
}
