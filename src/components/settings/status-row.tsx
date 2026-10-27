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
  /** Si el admin de Crisbo Tattoo apagó esta función para la cuenta (ver
   *  /admin → Módulos por cuenta): muestra el popup de suscripción en vez
   *  de navegar. */
  locked?: boolean
}) {
  if (locked) return <FeatureLockedRow label={label} />

  return (
    <Link
      href={href}
      data-tour={tourTag}
      className="group flex min-h-[3.25rem] items-center gap-3 rounded-[1.25rem] bg-card px-4 py-2 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold',
          ok ? 'bg-income/20 text-income' : 'bg-warning/20 text-warning'
        )}
      >
        {ok ? '✓' : '!'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[1.0625rem]">{label}</span>
      {value ? <span className="shrink-0 text-[15px] tabular-nums text-muted-foreground">{value}</span> : null}
    </Link>
  )
}
