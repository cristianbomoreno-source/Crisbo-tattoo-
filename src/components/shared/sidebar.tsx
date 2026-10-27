'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StudioBrand } from '@/components/shared/studio-brand'
import { NavLinks, SettingsNavLink } from '@/components/shared/nav-items'
import { LogoutButton } from '@/components/shared/logout-button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'ofink-sidebar-collapsed'

/** Ancho del sidebar expandido/colapsado — `AppShell` usa los mismos
 * valores para el margen del contenido, así que si se cambian acá hay que
 * cambiarlos allá también. */
export const SIDEBAR_WIDTH = { expanded: 'w-60', collapsed: 'w-[4.25rem]' } as const

/**
 * Sidebar de escritorio: panel de vidrio flotante con esquinas redondas (como
 * la barra lateral de Apple Games en iPad/Mac), desplegable a mano. En móvil/tablet
 * (<lg) se oculta y la navegación pasa al drawer de `AppShell`. El estado
 * (expandido/colapsado) se guarda en localStorage — persiste entre
 * sesiones, por estudio/navegador, no por usuario (no hay datos sensibles).
 */
export function Sidebar({
  studio,
}: {
  studio: { name: string; logoUrl: string | null } | null
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === '1') setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      window.dispatchEvent(new CustomEvent('ofink:sidebar-collapsed', { detail: next }))
      return next
    })
  }

  return (
    <aside
      className={cn(
        'glass fixed top-3 bottom-3 left-3 z-30 hidden flex-col rounded-[2rem] transition-[width] duration-200 lg:flex',
        collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded
      )}
    >
      <div className={cn('flex items-center px-5 pt-6 pb-4', collapsed && 'justify-center px-3')}>
        {collapsed ? (
          <Link href="/dashboard" aria-label={studio?.name ?? 'Mi estudio'}>
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary"
            >
              {(studio?.name ?? 'O').charAt(0)}
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="min-w-0">
            <StudioBrand name={studio?.name ?? 'Mi estudio'} logoUrl={studio?.logoUrl} />
          </Link>
        )}
      </div>

      <nav data-tour="nav-bar" className="flex-1 space-y-1 overflow-y-auto px-2.5">
        <NavLinks collapsed={collapsed} />
      </nav>

      <div className="space-y-1 p-2.5">
        <SettingsNavLink collapsed={collapsed} />
        <LogoutButton collapsed={collapsed} />
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expandir barra de navegación' : 'Contraer barra de navegación'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expandir' : 'Contraer'}
        className="absolute -right-3 top-8 grid size-6 place-items-center rounded-full border border-[var(--glass-border)] bg-popover text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
        ) : (
          <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </aside>
  )
}
