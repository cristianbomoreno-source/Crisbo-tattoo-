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
export const SIDEBAR_WIDTH = { expanded: 'w-64', collapsed: 'w-20' } as const

/**
 * Sidebar fijo de escritorio, ahora desplegable a mano. En móvil/tablet
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
        'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex',
        collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded
      )}
    >
      <div className={cn('flex items-center border-b border-sidebar-border p-6', collapsed && 'justify-center px-3')}>
        {collapsed ? (
          <Link href="/dashboard" aria-label={studio?.name ?? 'Mi estudio'}>
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold uppercase text-primary"
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

      <nav data-tour="nav-bar" className="flex-1 space-y-0.5 p-3">
        <NavLinks collapsed={collapsed} />
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SettingsNavLink collapsed={collapsed} />
        <LogoutButton collapsed={collapsed} />
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expandir barra de navegación' : 'Contraer barra de navegación'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expandir' : 'Contraer'}
        className="absolute -right-3 top-8 grid size-6 place-items-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
