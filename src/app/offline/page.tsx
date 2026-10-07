'use client'

import { WifiOff, RotateCw } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

/**
 * Fallback offline (spec §4.4). On-brand: carbón + rojo, sin datos inventados.
 * Se sirve desde el service worker cuando una navegación falla sin red.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="text-[2.75rem]" />

      <div className="flex size-16 items-center justify-center rounded-full bg-card text-muted-foreground">
        <WifiOff className="size-7" strokeWidth={1.6} aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.04em] text-foreground">
          Sin conexión
        </h1>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          No pudimos cargar esta vista. Revisá tu conexión a internet y volvé a
          intentarlo; tus datos te esperan.
        </p>
      </div>

      <Button onClick={() => window.location.reload()} className="h-11 gap-2 px-5">
        <RotateCw className="size-4" strokeWidth={1.8} aria-hidden="true" />
        Reintentar
      </Button>
    </main>
  )
}
