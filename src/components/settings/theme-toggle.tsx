'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Colores de fondo reales de cada tema (ver globals.css) —
 * sincroniza la barra de estado del sistema con el tema elegido. */
const THEME_COLOR = {
  dark: '#000000',
  light: '#fafaf7',
  minimal: '#ffffff',
} as const

type ThemeKey = keyof typeof THEME_COLOR

/**
 * Selector de tema para Ajustes. `next-themes` persiste la elección
 * (localStorage) y ya evita el parpadeo en la carga — ver theme-provider.tsx.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function select(next: ThemeKey) {
    setTheme(next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next])
  }

  const current = (mounted ? theme : 'dark') as ThemeKey

  const Icon = current === 'light' ? Sun : current === 'minimal' ? Minus : Moon

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            Apariencia
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            Elige el estilo visual de la app
          </span>
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Apariencia"
        className="flex items-center gap-1 rounded-full bg-muted p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={current === 'dark'}
          onClick={() => select('dark')}
          className={cn(
            'flex-1 rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
            current === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Oscuro
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={current === 'light'}
          onClick={() => select('light')}
          className={cn(
            'flex-1 rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
            current === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Claro
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={current === 'minimal'}
          onClick={() => select('minimal')}
          className={cn(
            'flex-1 rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
            current === 'minimal'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Minimal
        </button>
      </div>
    </div>
  )
}
