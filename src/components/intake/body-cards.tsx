'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { INTAKE_SIZES, INTAKE_GENDERS } from '@/lib/validations/intake'
import { sizeRender, SIZE_SHORT_LABELS } from '@/lib/body-render-assets'

/** Género: solo define qué librería de renders se muestra en los pasos
 * siguientes (tamaño/zona/subzona) — no se guarda en la cotización. */
export function GenderCards({ onPick }: { onPick: (v: 'Hombre' | 'Mujer') => void }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {INTAKE_GENDERS.map((gVal) => (
        <button
          key={gVal}
          type="button"
          onClick={() => onPick(gVal)}
          className="group relative overflow-hidden rounded-3xl border border-white/8 bg-card text-left transition-all active:scale-[0.97] hover:border-primary/50"
        >
          <span className="relative block aspect-[4/5] w-full overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gVal === 'Mujer' ? '/body-map/sexo-mujer.webp' : '/body-map/sexo-hombre.webp'}
              alt={gVal}
              loading="lazy"
              className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </span>
          <span className="block px-3 py-2.5 text-center font-heading text-sm font-semibold uppercase tracking-wide text-white">
            {gVal}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Tamaño: grid de 2 columnas con el render + etiqueta + subtítulo, check al
 * seleccionar. Reemplaza los cuadrados de color de `SizeCards`. */
export function BodySizeCards({
  gender, initialValue, onPick,
}: {
  gender?: 'Hombre' | 'Mujer'
  /** Preselecciona una tarjeta — para reusar este componente en pantallas
   * donde ya puede existir un valor previo (p. ej. el wizard de cotización
   * formal, si el usuario vuelve atrás). El bot no lo necesita (siempre
   * arranca en blanco), así que es opcional. */
  initialValue?: string
  onPick: (v: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(initialValue ?? null)

  function pick(size: string) {
    setSelected(size)
    onPick(size)
  }

  return (
    <div className="grid h-full w-full flex-1 grid-cols-3 grid-rows-2 gap-2">
      {INTAKE_SIZES.map((size) => {
        const active = selected === size
        return (
          <button
            key={size}
            type="button"
            onClick={() => pick(size)}
            className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all active:scale-[0.97] ${
              active ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-white/8 hover:border-white/20'
            }`}
          >
            <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sizeRender(gender, size)}
                alt={size}
                loading="lazy"
                className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {active && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              )}
            </span>
            <span className="block shrink-0 px-1.5 py-1.5 text-center">
              <span className="block font-heading text-[11px] font-semibold leading-tight text-white">
                {SIZE_SHORT_LABELS[size]}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
