import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { FeatureLockedRow } from '@/components/shared/feature-locked-row'

/**
 * Listas agrupadas al estilo de Ajustes del iPhone para la pestaña Estudio:
 * un grupo es una tarjeta redondeada con filas separadas por líneas finas;
 * cada fila lleva un cuadrito de color con su ícono, el nombre, un valor o
 * estado en gris y la flecha.
 */
export function SettingsGroup({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h2 className="mb-1.5 px-4 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>}
      <div className="overflow-hidden rounded-[1.25rem] bg-card [&>*+*]:border-t [&>*+*]:border-border">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  )
}

/** Cuadrito de color con el ícono (como los de Ajustes de iOS). `tone` es
 * una clase tile-* de globals.css. */
export function RowIcon({ icon: IconC, tone }: { icon: Icon; tone: string }) {
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-[0.55rem] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]', tone)}>
      <IconC className="size-[18px]" weight="fill" aria-hidden="true" />
    </span>
  )
}

export function SettingsRow({
  href,
  icon,
  tone,
  label,
  value,
  pending,
  tourTag,
  locked,
  external,
}: {
  href: string
  icon: Icon
  tone: string
  label: string
  /** Texto gris a la derecha ("Conectado", "3", "Lun – Sáb"). */
  value?: string
  /** Falta configurarlo: punto ámbar y el valor en ámbar. */
  pending?: boolean
  tourTag?: string
  /** Función apagada para la cuenta (ver /admin): muestra el aviso de suscripción. */
  locked?: boolean
  external?: boolean
}) {
  if (locked) return <FeatureLockedRow label={label} />
  return (
    <Link
      href={href}
      data-tour={tourTag}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="flex min-h-[3.25rem] items-center gap-3 px-4 py-2 transition-colors active:bg-foreground/[0.06] hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
    >
      <RowIcon icon={icon} tone={tone} />
      <span className="min-w-0 flex-1 truncate text-[1.0625rem]">{label}</span>
      {value && (
        <span className={cn('max-w-[45%] shrink-0 truncate text-[15px] tabular-nums', pending ? 'font-semibold text-warning' : 'text-muted-foreground')}>
          {value}
        </span>
      )}
      {pending && !value && <span className="size-2 shrink-0 rounded-full bg-warning" aria-label="Pendiente" />}
      <CaretRight className="size-4 shrink-0 text-muted-foreground/70" weight="bold" aria-hidden="true" />
    </Link>
  )
}
