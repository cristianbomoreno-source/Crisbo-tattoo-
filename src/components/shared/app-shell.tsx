'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/shared/sidebar'
import { MobileTopbar } from '@/components/shared/mobile-topbar'
import { MobileNav } from '@/components/shared/mobile-nav'
import { OctopusMenu } from '@/components/shared/octopus-menu'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { GuidedTour } from '@/components/shared/guided-tour'
import { PageHint } from '@/components/shared/page-hint'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'ofink-sidebar-collapsed'

/**
 * Cáscara responsive del dashboard.
 * - <lg: topbar con la marca + barra de pestañas inferior + FAB "Crear".
 * - lg+: sidebar fijo de escritorio (el FAB y la barra se ocultan), ahora
 *   desplegable a mano — el margen del contenido reacciona al mismo estado
 *   (ver `Sidebar`, que emite `ofink:sidebar-collapsed` al togglear).
 * Ver DESIGN.md §5, §7.
 */
export function AppShell({
  children,
  studio,
}: {
  children: React.ReactNode
  studio: { name: string; logoUrl: string | null; isStudioOwner?: boolean } | null
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true)
    function onToggle(e: Event) {
      setCollapsed(Boolean((e as CustomEvent<boolean>).detail))
    }
    window.addEventListener('ofink:sidebar-collapsed', onToggle)
    return () => window.removeEventListener('ofink:sidebar-collapsed', onToggle)
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fijo de escritorio */}
      <Sidebar studio={studio} />

      {/* Topbar móvil: solo la marca; se oculta dentro del wizard de cotización. */}
      <MobileTopbar studio={studio} />

      <div
        className={cn(
          // `min-w-0`: SIN esto, un flex item por defecto no se encoge más
          // allá del ancho intrínseco de su contenido más ancho (`min-width:
          // auto`) — con la tira de días del calendario cubriendo el mes
          // completo, ESE era el verdadero origen del bug real reportado
          // ("toda la pantalla de Inicio corrida hacia la izquierda"): no
          // era el calendario, era este contenedor entero (agregado junto
          // con el sidebar colapsable, después de v0.92.0) el que crecía de
          // más y arrastraba TODA la página. Con `min-w-0` el contenido
          // siempre se ajusta al ancho real del viewport y cualquier
          // desborde interno se queda contenido/scrolleable donde debe.
          'min-w-0 flex-1 transition-[margin] duration-200',
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {children}
      </div>

      <MobileNav />
      <OctopusMenu avatarUrl={studio?.logoUrl ?? null} isStudioOwner={studio?.isStudioOwner} />
      <InstallPrompt />
      <PageHint />
      <GuidedTour />
    </div>
  )
}
