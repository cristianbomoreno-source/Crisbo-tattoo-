'use client'

import { Check, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { styleRender } from '@/lib/body-render-assets'

/** `draft.style`/`answers.style`/`quotes.style` siguen siendo un solo
 * string de siempre — varias selecciones se guardan como lista separada
 * por comas ("Realismo, Blackwork"). Cero cambios de esquema/BD: todo lo
 * que ya lee ese campo (resúmenes, PDF, landing, mensajes) sigue
 * funcionando igual, solo que ahora puede traer más de un estilo. */
export function parseStyleValue(value?: string | null): string[] {
  if (!value) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function joinStyleValue(styles: string[]): string {
  return styles.join(', ')
}

/**
 * Carrusel de estilos con selección MÚLTIPLE — reemplaza a la grilla de
 * selección única que existía en el bot y en ambos wizards de cotización
 * (formal y rápida). Exactamente 3 tarjetas visibles por pantalla (ancho
 * del contenedor ÷ 3, contenido siempre DENTRO de su contenedor — nada de
 * márgenes negativos que se escapen del viewport, eso corría toda la
 * pantalla). "Otro" y "No lo sé" son exclusivos: elegir cualquiera de los
 * dos limpia el resto de la selección.
 */
export function StyleCarousel({
  value,
  onChange,
  styles,
  className,
}: {
  /** Valor actual, como string único (compatible con `draft.style` de siempre). */
  value?: string | null
  onChange: (value: string) => void
  styles: readonly string[]
  className?: string
}) {
  const selected = parseStyleValue(value)

  function toggle(style: string) {
    if (style === 'Otro' || style === 'No lo sé') {
      onChange(selected.length === 1 && selected[0] === style ? '' : style)
      return
    }
    const rest = selected.filter((s) => s !== 'Otro' && s !== 'No lo sé')
    const next = rest.includes(style) ? rest.filter((s) => s !== style) : [...rest, style]
    onChange(joinStyleValue(next))
  }

  return (
    <div
      className={cn(
        'flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-2',
        className
      )}
    >
      {styles.map((style) => {
        const active = selected.includes(style)
        const isOtro = style === 'Otro'
        const isDontKnow = style === 'No lo sé'
        const render = !isOtro && !isDontKnow ? styleRender(style) : null
        return (
          <button
            key={style}
            type="button"
            onClick={() => toggle(style)}
            aria-pressed={active}
            className={cn(
              'group relative flex w-[calc((100%-1.25rem)/3)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all active:scale-[0.97]',
              active ? 'border-primary ring-2 ring-primary/40' : 'border-white/8 hover:border-primary/40'
            )}
          >
            <span className="relative block aspect-square w-full overflow-hidden bg-black">
              {render ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={render}
                  alt={style}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="flex size-full items-center justify-center">
                  <MoreHorizontal className="size-6 text-primary/70" strokeWidth={1.8} aria-hidden="true" />
                </span>
              )}
              {active && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </span>
            <span className="line-clamp-2 block px-1 py-1.5 text-center font-heading text-[10px] font-semibold leading-tight uppercase tracking-wide text-white">
              {style}
            </span>
          </button>
        )
      })}
    </div>
  )
}
