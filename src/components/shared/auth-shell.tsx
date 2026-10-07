'use client'

import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/logo'

/**
 * Envoltorio del layout de auth (login / registro): fondo de marca fijo
 * (`auth-bg.jpg`) + bloque de logo completo y tagline, centrados sobre
 * `max-w-md`. El onboarding NO lo usa — trae su propio fondo por paso y su
 * propio header (wordmark + progreso, ver `step-shell.tsx`), y es un wizard
 * full-bleed (no cabe en `max-w-md` centrado). Montar ambos duplicaría la
 * marca y rompería su layout, así que se detecta por ruta y se hace
 * pass-through, mismo patrón que `mobile-topbar.tsx` (`usePathname` +
 * `return null` / bypass condicional).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/onboarding')) {
    return <>{children}</>
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-top opacity-50"
        style={{ backgroundImage: 'url(/brand/auth-bg.jpg)' }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo full className="text-6xl" />
        </div>
        {children}
      </div>
    </div>
  )
}
