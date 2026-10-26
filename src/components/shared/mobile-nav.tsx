'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_TAB_ITEMS } from '@/components/shared/nav-items'

/**
 * Navegación móvil de Crisbo Tattoo (<lg): barra flotante en forma de
 * píldora (estilo YouVersion) separada del borde inferior, de 4 posiciones
 * (Inicio, Proyectos, Mensajes, Estudio). Sin botón central: el menú-pulpo
 * se eliminó (2026-10-26). Íconos y etiquetas en el color del texto; la
 * pestaña activa se marca con una píldora gris detrás, no con color. En
 * escritorio (lg+) se oculta; ahí manda el sidebar.
 *
 * La pestaña "Estudio" navega directo a /dashboard/settings: arriba lista los
 * módulos que no caben en la barra (Cotizaciones, Caja, Clientes,
 * Consentimientos, Galería, Estadísticas — ver studio-modules.tsx).
 */
export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  // Dentro del wizard de cotización la app es pantalla completa: sin tab bar
  // (evita toques accidentales que saquen del flujo).
  if (pathname === '/dashboard/quotes/new' || pathname === '/dashboard/quotes/quick') return null

  const tourTag = (href: string) =>
    href === '/dashboard' ? 'nav-home' : href === '/dashboard/quotes' ? 'nav-quotes' : undefined

  return (
    <nav
      aria-label="Navegación principal"
      data-tour="nav-bar"
      className="fixed inset-x-3 bottom-[calc(8px+env(safe-area-inset-bottom))] z-30 flex h-16 items-stretch gap-1 rounded-full border border-border bg-card p-1.5 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.35)] lg:hidden"
    >
      {MOBILE_TAB_ITEMS.map((item) => (
        <TabLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} tour={tourTag(item.href)} />
      ))}
      <TabLink href="/dashboard/settings" label="Estudio" icon={LayoutGrid} active={isActive('/dashboard/settings')} tour="nav-studio" />
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
  icon: LucideIcon
  active: boolean
  tour?: string
}) {
  return (
    <Link
      href={href}
      data-tour={tour}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active ? 'bg-muted' : 'hover:bg-muted/60'
      )}
    >
      <Icon className="size-[22px]" />
      <span className="max-w-full truncate text-[12px] font-semibold leading-none tracking-tight">{label}</span>
    </Link>
  )
}
