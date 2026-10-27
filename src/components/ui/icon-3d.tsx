import { cn } from '@/lib/utils'

/** Íconos 3D de Microsoft Fluent Emoji (MIT), servidos desde public/icons/3d.
 * Van dentro de las tarjetas de color (`Tile`) y en filas destacadas, como
 * los íconos 3D de Apple Games. Para íconos de interfaz (barras, botones)
 * se siguen usando los de Phosphor. */
export type Icon3DName =
  | 'artist-palette'
  | 'bar-chart'
  | 'bell'
  | 'bookmark-tabs'
  | 'bullseye'
  | 'busts-in-silhouette'
  | 'calendar'
  | 'camera'
  | 'chart-increasing'
  | 'clipboard'
  | 'coin'
  | 'credit-card'
  | 'dollar-banknote'
  | 'envelope'
  | 'fountain-pen'
  | 'framed-picture'
  | 'gear'
  | 'hourglass-not-done'
  | 'house'
  | 'identification-card'
  | 'light-bulb'
  | 'memo'
  | 'mobile-phone'
  | 'money-bag'
  | 'package'
  | 'pen'
  | 'receipt'
  | 'sparkles'
  | 'speech-balloon'
  | 'spiral-calendar'
  | 'star'
  | 'trophy'

export function Icon3D({ name, className }: { name: Icon3DName; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/3d/${name}.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('size-14 shrink-0 select-none object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)]', className)}
    />
  )
}
