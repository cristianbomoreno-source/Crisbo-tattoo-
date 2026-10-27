import { TileGrid, type TileTone } from '@/components/ui/tile'
import type { Icon3DName } from '@/components/ui/icon-3d'

type Module = { href: string; icon: Icon3DName; tone: TileTone; label: string; tour?: string; ownerOnly?: boolean }

const MODULES: Module[] = [
  { href: '/dashboard/quotes', icon: 'clipboard', tone: 'sunset', label: 'Cotizaciones', tour: 'nav-quotes-mobile' },
  { href: '/dashboard?caja=1', icon: 'money-bag', tone: 'teal', label: 'Caja y cuentas', ownerOnly: true },
  { href: '/dashboard/clients', icon: 'identification-card', tone: 'gray', label: 'Clientes' },
  { href: '/dashboard/consents', icon: 'fountain-pen', tone: 'purple', label: 'Consenti­mientos' },
  { href: '/dashboard/gallery', icon: 'framed-picture', tone: 'green', label: 'Galería' },
  { href: '/dashboard/stats', icon: 'chart-increasing', tone: 'indigo', label: 'Estadísticas', ownerOnly: true },
]

/**
 * Pestaña "Estudio" en el celular: la barra inferior solo tiene Inicio,
 * Proyectos, Mensajes y Estudio, así que aquí arriba van los módulos que en
 * escritorio están en el sidebar, como la cuadrícula de categorías de Buscar
 * en Apple Games. En escritorio se muestra igual, en 3 columnas.
 */
export function StudioModules({ isOwner }: { isOwner: boolean }) {
  const items = MODULES.filter((m) => isOwner || !m.ownerOnly)
  return (
    <nav aria-label="Tu estudio" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ href, icon, tone, label, tour }) => (
        <TileGrid key={href} href={href} tone={tone} icon={icon} title={label} data-tour={tour} />
      ))}
    </nav>
  )
}
