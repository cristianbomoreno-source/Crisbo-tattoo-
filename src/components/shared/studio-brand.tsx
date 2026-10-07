import { cn } from '@/lib/utils'

/**
 * Marca del estudio en el chrome (topbar móvil y sidebar de escritorio).
 * Siempre texto: nombre del estudio en mayúsculas + punto de marca. Ya no
 * se muestra la imagen de `logoUrl` arriba en ningún lado de la web —el
 * parámetro se mantiene por compatibilidad con quienes llaman a este
 * componente, pero se ignora a propósito.
 */
export function StudioBrand({
  name,
  variant = 'full',
}: {
  name: string
  logoUrl?: string | null
  variant?: 'full' | 'compact'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-display font-semibold uppercase leading-none tracking-[0.06em] text-foreground',
        variant === 'compact' ? 'text-lg' : 'text-2xl'
      )}
    >
      <span className="truncate max-w-[12rem]">{name}</span>
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 rounded-full bg-primary',
          variant === 'compact' ? 'size-1.5' : 'size-2'
        )}
      />
    </span>
  )
}
