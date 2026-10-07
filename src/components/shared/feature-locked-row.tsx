'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

/** Reemplaza a un `StatusRow`/enlace de módulo cuando el admin de OFINK
 * apagó esa función para la cuenta (ver /admin → Módulos por cuenta).
 * Al tocarlo, avisa que estará disponible más adelante por suscripción —
 * no navega a ningún lado. */
export function FeatureLockedRow({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex min-h-9 w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className="grid size-4.5 shrink-0 place-items-center rounded-full bg-white/10 text-muted-foreground"
        >
          <Lock className="size-2.5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-card p-5 text-center shadow-xl"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="size-5" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-semibold">Disponible más adelante</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Esta función estará disponible más adelante por medio de suscripción.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
