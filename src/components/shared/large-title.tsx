import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Encabezado de pestaña al estilo iOS (Biblioteca, Buscar de Apple Games):
 * título grande a la izquierda y el avatar redondo gris a la derecha, que
 * lleva al perfil. `actions` va antes del avatar (campana, filtros…).
 */
export function LargeTitle({
  title,
  actions,
  avatar,
  className,
}: {
  title: React.ReactNode
  actions?: React.ReactNode
  /** Inicial o foto del perfil; sin esto no se muestra avatar. */
  avatar?: { initial: string; photoUrl?: string | null }
  className?: string
}) {
  return (
    <header className={cn('flex items-center justify-between gap-3 lg:hidden', className)}>
      <h1 className="large-title min-w-0 truncate">{title}</h1>
      <div className="flex shrink-0 items-center gap-2.5">
        {actions}
        {avatar && (
          <Link
            href="/dashboard/settings/perfil"
            aria-label="Tu perfil"
            className="transition-transform duration-150 ease-out active:scale-[0.94]"
          >
            {avatar.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar.photoUrl} alt="" className="size-12 rounded-full object-cover" />
            ) : (
              <span className="grid size-12 place-items-center rounded-full bg-[linear-gradient(180deg,#6e6e73,#3a3a3c)] text-[1.375rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
                {avatar.initial}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  )
}

/** Título de sección grande ("Tus juegos" + "115 en total"), con un botón
 * redondo opcional a la derecha. */
export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="font-title text-[1.625rem] leading-tight font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[1.0625rem] leading-snug text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
