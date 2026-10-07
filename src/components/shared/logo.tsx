import { cn } from '@/lib/utils'

/**
 * Logo de Crisbo Tattoo. Versión simplificada sin assets gráficos,
 * solo texto estilizado.
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
      <div className="inline-flex flex-col items-center">
        <span className="font-title text-[1.5em] uppercase tracking-wide text-foreground">
          Crisbo
        </span>
        {full && (
          <span className="text-[0.6em] font-medium uppercase tracking-[0.3em] text-primary">
            Tattoo
          </span>
        )}
      </div>
      {subtitle ? (
        <span className="mt-1.5 block font-display text-[10px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </div>
  )
}
