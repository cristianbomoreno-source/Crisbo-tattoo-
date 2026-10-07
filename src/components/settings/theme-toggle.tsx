'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Colores de fondo reales de cada tema (ver globals.css :root / .dark) —
 * sincroniza la barra de estado del sistema con el tema elegido. */
const THEME_COLOR = { dark: '#000000', light: '#fafaf7' } as const

/**
 * Selector Oscuro/Claro para Ajustes. `next-themes` persiste la elección
 * (localStorage) y ya evita el parpadeo en la carga — ver theme-provider.tsx.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Evita un mismatch de hidratación: en el servidor no hay tema resuelto
  // todavía (depende del localStorage del navegador).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function select(next: 'dark' | 'light') {
    setTheme(next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next])
  }

  const current = mounted ? theme : 'dark'

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-background/40 p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {current === 'light' ? (
          <Sun className="size-5" strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <Moon className="size-5" strokeWidth={1.8} aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          Apariencia
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          Fondo oscuro o claro para toda la app
        </span>
      </span>
      <div
        role="radiogroup"
        aria-label="Apariencia"
        className="flex shrink-0 items-center gap-1 rounded-full bg-muted p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={current === 'dark'}
          onClick={() => select('dark')}
          className={cn(
            'rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
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
            'rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
            current === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Claro
        </button>
      </div>
    </div>
  )
}
