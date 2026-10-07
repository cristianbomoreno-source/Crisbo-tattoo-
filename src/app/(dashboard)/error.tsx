'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Red de seguridad para todo el panel (`/dashboard/*`): si una página
 * llegara a lanzar una excepción sin manejar, Next.js muestra esto en vez
 * de una pantalla en blanco/rota. No debería activarse en el uso normal —
 * es la última línea de defensa, no un reemplazo de manejar errores bien
 * en cada página.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-lg font-semibold uppercase tracking-wide">Algo no cargó bien</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Puede haber sido un problema momentáneo de conexión. Intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}
