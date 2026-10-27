import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d'

export type TileTone = 'gold' | 'brown' | 'teal' | 'indigo' | 'sunset' | 'red' | 'blue' | 'green' | 'purple' | 'gray' | 'slate'

// Clases literales para que Tailwind las encuentre (ver @utility tile-* en globals.css).
const TONE: Record<TileTone, string> = {
  gold: 'tile-gold',
  brown: 'tile-brown',
  teal: 'tile-teal',
  indigo: 'tile-indigo',
  sunset: 'tile-sunset',
  red: 'tile-red',
  blue: 'tile-blue',
  green: 'tile-green',
  purple: 'tile-purple',
  gray: 'tile-gray',
  slate: 'tile-slate',
}

type Common = {
  tone: TileTone
  icon: Icon3DName
  title: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  'data-tour'?: string
}
type Action = { href: string; onClick?: never } | { href?: never; onClick: () => void }

const PRESS =
  'transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Tarjeta de color al estilo Apple Games.
 * - `TileRow` (como "Novedades y eventos" / "Logros"): ancho completo, ícono
 *   3D a la izquierda, título y subtítulo, flecha a la derecha.
 * - `TileGrid` (como las categorías de Buscar): en cuadrícula de 2, ícono 3D
 *   arriba a la derecha y título grande abajo a la izquierda.
 */
export function TileRow({ tone, icon, title, subtitle, className, href, onClick, ...rest }: Common & Action) {
  const body = (
    <>
      <Icon3D name={icon} className="size-16" />
      <span className="min-w-0 flex-1">
        <span className="block text-[1.375rem] leading-tight font-bold tracking-tight text-white">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[1.0625rem] text-white/70">{subtitle}</span>}
      </span>
      <CaretRight className="size-6 shrink-0 text-white/80" weight="bold" aria-hidden="true" />
    </>
  )
  const cls = cn('flex min-h-[7.5rem] w-full items-center gap-4 rounded-[2rem] px-5 py-4 text-left', TONE[tone], PRESS, className)
  return href ? (
    <Link href={href} className={cls} data-tour={rest['data-tour']}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} data-tour={rest['data-tour']}>
      {body}
    </button>
  )
}

export function TileGrid({ tone, icon, title, subtitle, className, href, onClick, ...rest }: Common & Action) {
  const body = (
    <>
      <Icon3D name={icon} className="absolute top-2.5 right-2.5 size-14" />
      <span className="relative mt-auto block min-w-0">
        {subtitle && <span className="block truncate text-[13px] font-semibold text-white/75">{subtitle}</span>}
        <span className="block text-[1.3125rem] leading-[1.1] font-bold tracking-tight text-pretty text-white">{title}</span>
      </span>
    </>
  )
  const cls = cn('relative flex min-h-[7.5rem] flex-col overflow-hidden rounded-[1.75rem] p-4 text-left', TONE[tone], PRESS, className)
  return href ? (
    <Link href={href} className={cls} data-tour={rest['data-tour']}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} data-tour={rest['data-tour']}>
      {body}
    </button>
  )
}
