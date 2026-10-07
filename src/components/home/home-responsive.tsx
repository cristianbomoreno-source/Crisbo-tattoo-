'use client'

import { useEffect, useState } from 'react'
import { HomeDesktop } from '@/components/home/home-desktop'
import type { HomeDesktopProps } from '@/components/home/home-desktop'

const QUERY = '(min-width: 768px)'

/**
 * Monta `HomeDesktop` (con su propio `CalendarCard`, `NextSessionCard`,
 * etc.) SOLO cuando el viewport real es iPad/escritorio — nunca en móvil,
 * ni siquiera oculto por CSS. Antes, `dashboard/page.tsx` renderizaba los
 * dos layouts SIEMPRE (uno con `md:hidden`, el otro con `hidden
 * md:block`): ambos quedaban montados al mismo tiempo, con sus propios
 * diálogos (p. ej. dos `CalendarCard` reaccionando a la vez a
 * `?openCalendar=1`) — eso rompía el móvil (diálogos/FAB pisándose).
 *
 * Ahora el móvil (`mobileHome` en `dashboard/page.tsx`) se renderiza
 * directo, sin pasar por ningún componente cliente ni depender de JS —
 * exactamente como antes de que existiera la versión de escritorio. Este
 * componente solo decide si monta la versión de escritorio ENCIMA de eso;
 * por defecto (SSR y primer render) no monta nada, así en un teléfono
 * `HomeDesktop` nunca toca el DOM.
 */
export function HomeDesktopGate(props: HomeDesktopProps) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    setIsDesktop(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  if (!isDesktop) return null
  return <HomeDesktop {...props} />
}
