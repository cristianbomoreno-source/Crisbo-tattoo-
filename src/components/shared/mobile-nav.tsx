'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquaresFour, type Icon as IconType } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { MOBILE_TAB_ITEMS } from '@/components/shared/nav-items'

/**
 * Navegación móvil de Crisbo Tattoo (<lg): barra flotante en forma de
 * píldora de vidrio (estilo Apple Games / iOS 26) separada del borde inferior, de 4 posiciones
 * (Inicio, Proyectos, Mensajes, Estudio). Íconos siempre rellenos; la
 * pestaña activa lleva una cápsula clara detrás y el ícono en dorado. En
 * escritorio (lg+) se oculta; ahí manda el sidebar.
 *
 * La pestaña "Estudio" navega directo a /dashboard/settings: arriba lista los
 * módulos que no caben en la barra (Cotizaciones, Caja, Clientes,
 * Consentimientos, Galería, Estadísticas — ver studio-modules.tsx).
 */
export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/'))

  // Dentro del wizard de cotización la app es pantalla completa: sin tab bar
  // (evita toques accidentales que saquen del flujo).
  if (pathname === '/dashboard/quotes/new' || pathname === '/dashboard/quotes/quick') return null

  const tourTag = (href: string) => (href === '/dashboard' ? 'nav-home' : href === '/dashboard/quotes' ? 'nav-quotes' : undefined)

  return (
    <nav
      aria-label="Navegación principal"
      data-tour="nav-bar"
      className="glass fixed inset-x-4 bottom-[calc(8px+env(safe-area-inset-bottom))] z-30 flex h-[4.25rem] items-stretch gap-0.5 rounded-full p-1.5 lg:hidden"
    >
      {MOBILE_TAB_ITEMS.map((item) => (
        <TabLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
          tour={tourTag(item.href)}
        />
      ))}
      <TabLink href="/dashboard/settings" label="Estudio" icon={SquaresFour} active={isActive('/dashboard/settings')} tour="nav-studio" />
    </nav>
  )
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
  tour,
}: {
  href: string
  label: string
  icon: IconType
  active: boolean
  tour?: string
}) {
  return (
    <Link
      href={href}
      data-tour={tour}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full transition-[background-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:scale-[0.96]',
        active ? 'bg-[var(--glass-active)] text-foreground' : 'text-foreground/90',
      )}
    >
      <Icon className={cn('size-[26px]', active && 'text-primary')} weight="fill" />
      <span className={cn('max-w-full truncate text-[11px] leading-none font-medium', active && 'text-primary')}>{label}</span>
    </Link>
  )
}
