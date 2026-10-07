'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Layers,
  Users,
  ClipboardList,
  BarChart3,
  FileSignature,
  Images,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Fuente única de verdad de la navegación de OFINK.
 * La consumen el sidebar de escritorio y el drawer móvil (ver DESIGN.md §5, §7).
 */
export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/projects', label: 'Proyectos', icon: Layers },
  { href: '/dashboard/quotes', label: 'Cotizaciones', icon: ClipboardList },
  { href: '/dashboard/stats', label: 'Estadísticas', icon: BarChart3 },
  { href: '/dashboard/clients', label: 'Clientes', icon: Users },
  { href: '/dashboard/consents', label: 'Consentimientos', icon: FileSignature },
  { href: '/dashboard/gallery', label: 'Galería', icon: Images },
]

/** Pestañas laterales de la barra inferior móvil (Inicio, Cotizaciones a la izquierda del FAB; Proyectos a la derecha) — como el mockup. El FAB pulpo central lo renderiza mobile-nav; la pestaña "Estudio" navega directo a /dashboard/settings. */
export const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((i) =>
  ['/dashboard', '/dashboard/quotes', '/dashboard/projects'].includes(i.href)
)

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
        const active = pathname === item.href
        const tourTag =
          item.href === '/dashboard' ? 'nav-home' : item.href === '/dashboard/quotes' ? 'nav-quotes' : undefined
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={tourTag}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'relative flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 font-display text-[13px] font-medium uppercase tracking-[0.12em] transition-colors',
              collapsed && 'justify-center px-0',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
            )}
          >
            {active && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sidebar-primary" />
            )}
            <Icon
              className={cn(
                'size-[18px] shrink-0',
                active ? 'text-sidebar-primary' : 'text-muted-foreground'
              )}
              strokeWidth={1.6}
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
        'relative flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 font-display text-[13px] font-medium uppercase tracking-[0.12em] transition-colors',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sidebar-primary" />
      )}
      <Settings
        className={cn('size-[18px] shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')}
        strokeWidth={1.6}
      />
      {!collapsed && 'Ajustes'}
    </Link>
  )
}
