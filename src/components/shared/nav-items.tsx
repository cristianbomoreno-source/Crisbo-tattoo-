'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartLineUp,
  ChatsCircle,
  ClipboardText,
  GearSix,
  House,
  ImagesSquare,
  PenNib,
  Signature,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Fuente única de verdad de la navegación de Crisbo Tattoo.
 * La consumen el sidebar de escritorio y el drawer móvil (ver DESIGN.md §5, §7).
 */
// Íconos Phosphor: trazo normal en reposo y relleno cuando la sección está activa.
export const NAV_ITEMS: { href: string; label: string; icon: Icon }[] = [
  { href: '/dashboard', label: 'Inicio', icon: House },
  { href: '/dashboard/inbox', label: 'Mensajes', icon: ChatsCircle },
  { href: '/dashboard/projects', label: 'Proyectos', icon: PenNib },
  { href: '/dashboard/quotes', label: 'Cotizaciones', icon: ClipboardText },
  { href: '/dashboard/stats', label: 'Estadísticas', icon: ChartLineUp },
  { href: '/dashboard/clients', label: 'Clientes', icon: UsersThree },
  { href: '/dashboard/consents', label: 'Consentimientos', icon: Signature },
  { href: '/dashboard/gallery', label: 'Galería', icon: ImagesSquare },
]

/** Pestañas de la barra inferior móvil (más "Estudio", que lleva a /dashboard/settings con el resto de módulos arriba). */
const MOBILE_TAB_HREFS = ['/dashboard', '/dashboard/projects', '/dashboard/inbox']
export const MOBILE_TAB_ITEMS = MOBILE_TAB_HREFS.map((href) => NAV_ITEMS.find((i) => i.href === href)!)

/**
 * Lista de enlaces de navegación. `onNavigate` permite al drawer móvil cerrarse
 * al pulsar un ítem. Touch targets ≥ 44px (py-2.5 + tamaño de fuente).
 * `collapsed` (solo sidebar de escritorio) oculta la etiqueta y centra el
 * ícono — el link sigue siendo el mismo, solo cambia la presentación.
 */
export function NavLinks({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
        const tourTag = item.href === '/dashboard' ? 'nav-home' : item.href === '/dashboard/quotes' ? 'nav-quotes' : undefined
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={tourTag}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'relative flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 font-display text-[14px] font-medium transition-colors',
              collapsed && 'justify-center px-0',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sidebar-primary" />}
            <Icon
              className={cn('size-[18px] shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')}
              weight={active ? 'fill' : 'regular'}
            />
            {!collapsed && item.label}
          </Link>
        )
      })}
    </>
  )
}

/** Enlace de Ajustes, separado de la nav de módulos (va al pie del sidebar/drawer). */
export function SettingsNavLink({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname()
  const active = pathname === '/dashboard/settings'
  return (
    <Link
      href="/dashboard/settings"
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? 'Ajustes' : undefined}
      className={cn(
        'relative flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 font-display text-[14px] font-medium transition-colors',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sidebar-primary" />}
      <GearSix
        className={cn('size-[18px] shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')}
        weight={active ? 'fill' : 'regular'}
      />
      {!collapsed && 'Ajustes'}
    </Link>
  )
}
