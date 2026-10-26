'use client'

import { useLayoutEffect, type ReactNode } from 'react'
import { cn } from '../../src/lib/utils'

const THEMES = ['dark', 'light', 'minimal'] as const

/**
 * Raíz de Crisbo Tattoo para Claude Design: hace lo que `src/app/layout.tsx`
 * y `ThemeProvider` (next-themes) hacen en la app. Pone la clase del tema en
 * `<html>` (así los diálogos, menús y selects, que se abren en un portal
 * fuera de este div, también salen con el tema) y pinta el fondo, el color y
 * la letra del cuerpo. Sin ella los componentes salen en tema claro y sin el
 * fondo negro cálido. El tema por defecto de la app es `dark`.
 */
export function CrisboRoot({
  theme = 'dark',
  className,
  children,
}: {
  /** Tema de la app: `dark` (por defecto, negro y dorado), `light` o `minimal`. */
  theme?: 'dark' | 'light' | 'minimal'
  className?: string
  children?: ReactNode
}) {
  useLayoutEffect(() => {
    const html = document.documentElement
    html.classList.remove(...THEMES)
    html.classList.add(theme, 'bg-background')
    document.body.classList.add('bg-background', 'text-foreground', 'font-sans', 'antialiased')
  }, [theme])

  return <div className={cn(theme, 'bg-background font-sans text-foreground antialiased', className)}>{children}</div>
}
