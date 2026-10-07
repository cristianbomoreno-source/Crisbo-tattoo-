import { cn } from '@/lib/utils'

/**
 * Logo de Crisbo Tattoo.
 * - `full={true}` (default): Logo completo con "CRISBO TATTOO STUDIO"
 * - `full={false}`: Solo el icono CB
 */
export function Logo({
  className,
  subtitle,
  full = true,
}: {
  className?: string
  subtitle?: string
  full?: boolean
}) {
  return (
    <div className={cn('select-none', className)}>
      {full ? (
        // Logo completo con texto
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/cb-logo-full.png"
          alt="Crisbo Tattoo Studio"
          className="h-[4em] w-auto"
        />
      ) : (
        // Solo icono CB
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/cb-icon.png"
          alt="CB"
          className="h-[2em] w-auto rounded-lg"
        />
      )}
      {subtitle ? (
        <span className="mt-1.5 block font-display text-[10px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </div>
  )
}
