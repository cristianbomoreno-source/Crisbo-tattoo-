import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FeatureLockedRow } from '@/components/shared/feature-locked-row'

/** Fila de estado: ✓ listo / ⚠ pendiente, y es el Link directo a la
 * subpágina de siempre — el estado se ve sin abrir nada. Compartida entre
 * el Centro de control (resumen) y las páginas-hub de cada módulo. */
export function StatusRow({
  href,
  ok,
  label,
  value,
  tourTag,
  locked = false,
}: {
  href: string
  ok: boolean
  label: string
  /** Detalle opcional a la derecha (p. ej. "4 métodos", "20%"). */
  value?: string
  /** `data-tour` opcional — solo en las filas que el tutorial guiado señala. */
  tourTag?: string
  /** Si el admin de OFINK apagó esta función para la cuenta (ver
   *  /admin → Módulos por cuenta): muestra el popup de suscripción en vez
   *  de navegar. */
  locked?: boolean
}) {
  if (locked) return <FeatureLockedRow label={label} />

  return (
    <Link
      href={href}
      data-tour={tourTag}
      className="group flex min-h-9 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-4.5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
          ok ? 'bg-primary/20 text-primary' : 'bg-amber-400/15 text-amber-400'
        )}
      >
        {ok ? '✓' : '!'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">{label}</span>
      {value ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{value}</span> : null}
    </Link>
  )
}
