'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_TAB_ITEMS } from '@/components/shared/nav-items'

/**
 * Navegación móvil de OFINK (<lg): barra inferior opaca pegada al borde
 * (estilo Instagram) de 5 posiciones (Inicio, Proyectos, hueco central para
 * el pulpo de octopus-menu.tsx, Cotizaciones, Estudio). En escritorio (lg+)
 * se oculta; ahí manda el sidebar. Ver DESIGN.md §5, §7.
 *
 * La pestaña "Estudio" navega directo a /dashboard/settings (el Centro de
 * control del estudio, ver studio-control-center.tsx) — antes abría una
 * hoja intermedia con accesos duplicados; se quitó porque tapaba la
 * pantalla con un popup innecesario sobre el contenido.
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

  const settingsActive = isActive('/dashboard/settings')

  return (
    <nav
      aria-label="Navegación principal"
      data-tour="nav-bar"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(64px+env(safe-area-inset-bottom))] items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {MOBILE_TAB_ITEMS.slice(0, 2).map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const tourTag = item.href === '/dashboard' ? 'nav-home' : item.href === '/dashboard/quotes' ? 'nav-quotes' : undefined
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={tourTag}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[26px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Icon
              className={cn(
                'size-5 transition-colors duration-200',
                active ? 'text-primary' : 'text-neutral-400'
              )}
              strokeWidth={active ? 2 : 1.6}
            />
            <span
              className={cn(
                'text-[11px] font-medium transition-colors duration-200',
                active ? 'text-primary' : 'text-neutral-400'
              )}
            >
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'absolute bottom-2 h-[3px] rounded-full bg-primary transition-all duration-300',
                active ? 'w-7 opacity-100' : 'w-0 opacity-0'
              )}
            />
          </Link>
        )
      })}
      {/* Hueco central: aquí vive el pulpo (octopus-menu.tsx, fixed + z-40) */}
      <div className="w-[96px] shrink-0" aria-hidden="true" />
      {MOBILE_TAB_ITEMS.slice(2).map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const tourTag = item.href === '/dashboard/quotes' ? 'nav-quotes' : undefined
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={tourTag}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[26px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Icon
              className={cn(
                'size-5 transition-colors duration-200',
                active ? 'text-primary' : 'text-neutral-400'
              )}
              strokeWidth={active ? 2 : 1.6}
            />
            <span
              className={cn(
                'text-[11px] font-medium transition-colors duration-200',
                active ? 'text-primary' : 'text-neutral-400'
              )}
            >
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'absolute bottom-2 h-[3px] rounded-full bg-primary transition-all duration-300',
                active ? 'w-7 opacity-100' : 'w-0 opacity-0'
              )}
            />
          </Link>
        )
      })}
      <Link
        href="/dashboard/settings"
        aria-current={settingsActive ? 'page' : undefined}
        aria-label="Estudio"
        className="relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[26px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <LayoutGrid
          className={cn(
            'size-5 transition-colors duration-200',
            settingsActive ? 'text-primary' : 'text-neutral-400'
          )}
          strokeWidth={settingsActive ? 2 : 1.6}
        />
        <span
          className={cn(
            'text-[11px] font-medium transition-colors duration-200',
            settingsActive ? 'text-primary' : 'text-neutral-400'
          )}
        >
          Estudio
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-2 h-[3px] rounded-full bg-primary transition-all duration-300',
            settingsActive ? 'w-7 opacity-100' : 'w-0 opacity-0'
          )}
        />
      </Link>
    </nav>
  )
}
