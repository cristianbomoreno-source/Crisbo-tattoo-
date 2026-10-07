'use client'

import { useState } from 'react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

/** Pantalla que tapa Inicio cuando hoy está en "Fechas especiales" (bloqueado).
 * "Acceder" solo la esconde para esta pestaña y este día (sessionStorage);
 * al día siguiente (u otra pestaña) vuelve a aparecer. */
export function RestDayGate({
  date,
  reason,
  children,
}: {
  date: string
  reason?: string | null
  children: React.ReactNode
}) {
  const storageKey = `ofink:rest-day-accessed:${date}`
  const [entered, setEntered] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(storageKey) === '1'
  })

  if (entered) return <>{children}</>

  return (
    <main className="flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="text-[2.75rem]" />

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.04em] text-foreground">
          Hoy es tu día de descanso
        </h1>
        {reason && (
          <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-muted-foreground">{reason}</p>
        )}
      </div>

      <Button
        onClick={() => {
          sessionStorage.setItem(storageKey, '1')
          setEntered(true)
        }}
        className="h-11 px-6"
      >
        Acceder
      </Button>
    </main>
  )
}
