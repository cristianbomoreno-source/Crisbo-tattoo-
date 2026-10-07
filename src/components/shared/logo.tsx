import { cn } from '@/lib/utils'

/**
 * Logo de OFINK (assets de marca reales). El pulpo se pinta en el verde de
 * marca (`--primary`) recortando la silueta sólida `pulpo-negro.png` como
 * máscara CSS — el wordmark blanco (`ofink-wordmark.png`) ya viene correcto
 * y se usa tal cual. `full` = pulpo + wordmark; por defecto (y salvo que se
 * pida explícitamente solo el wordmark con `full={false}`) se ve la marca
 * completa. La altura escala con el font-size del contenedor (em).
 * Ver DESIGN.md §3.
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
        <div className="inline-flex flex-col items-center">
          <span
            aria-hidden="true"
            className="h-[2em] w-[2em] bg-primary"
            style={{
              WebkitMaskImage: 'url(/brand/pulpo-negro.png)',
              maskImage: 'url(/brand/pulpo-negro.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ofink-wordmark.png" alt="OFINK" className="mt-1 h-[0.85em] w-auto" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/ofink-wordmark.png" alt="OFINK" className="inline-block h-[1.15em] w-auto" />
      )}
      {subtitle ? (
        <span className="mt-1.5 block font-display text-[10px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </div>
  )
}
