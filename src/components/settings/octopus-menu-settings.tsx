'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  OCTOPUS_ACTIONS,
  actionById,
  readOctopusSlots,
  writeOctopusSlots,
  DEFAULT_OCTOPUS_SLOTS,
  DEFAULT_OCTOPUS_SLOTS_ESTUDIO,
} from '@/lib/octopus-actions'

const SLOT_LABELS = ['Brazo ext. izquierdo', 'Brazo int. izquierdo', 'Brazo int. derecho', 'Brazo ext. derecho']

/**
 * "Menú del pulpo" (Ajustes → Personalización): elegir qué acción muestra
 * cada uno de los 4 botones del menú pulpo al desplegarse. Se toca un brazo
 * y luego la acción del catálogo que debe ocuparlo. La preferencia vive en
 * localStorage de ESTE dispositivo (ver lib/octopus-actions.ts) y el menú
 * la aplica al instante — sin tocar la base de datos.
 */
export function OctopusMenuSettings({ accountKind }: { accountKind?: 'tatuador' | 'estudio' }) {
  const [slots, setSlots] = useState<string[] | null>(null)
  const [activeSlot, setActiveSlot] = useState(0)

  useEffect(
    () => setSlots(readOctopusSlots(accountKind === 'estudio' ? DEFAULT_OCTOPUS_SLOTS_ESTUDIO : DEFAULT_OCTOPUS_SLOTS)),
    [accountKind]
  )
  if (!slots) return null

  function assign(actionId: string) {
    if (!slots) return
    const next = [...slots]
    // Si la acción ya vive en otro brazo, intercambia — nunca hay repetidas.
    const existing = next.indexOf(actionId)
    if (existing >= 0 && existing !== activeSlot) next[existing] = next[activeSlot]!
    next[activeSlot] = actionId
    setSlots(next)
    writeOctopusSlots(next)
    toast.success('Menú del pulpo actualizado')
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
        Menú del pulpo
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Elige qué botón muestra cada brazo al desplegarse.
      </p>

      {/* Los 4 brazos con su acción actual — tocar uno lo selecciona. */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {slots.map((id, i) => {
          const action = actionById(id)
          const Icon = action.icon
          const active = i === activeSlot
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlot(i)}
              aria-label={`${SLOT_LABELS[i]}: ${action.label}`}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              <Icon className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[10px] leading-none">{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Catálogo de acciones disponibles para el brazo seleccionado. */}
      <p className="mt-3 text-[11px] text-muted-foreground">{SLOT_LABELS[activeSlot]} mostrará:</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {OCTOPUS_ACTIONS.map((a) => {
          const Icon = a.icon
          const current = slots[activeSlot] === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => assign(a.id)}
              aria-pressed={current}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                current
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-primary/50'
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
              {a.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-muted-foreground/70">
        Esta preferencia se guarda en este dispositivo.
      </p>
    </div>
  )
}
