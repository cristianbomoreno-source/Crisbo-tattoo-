'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

const PRESETS = [30, 45, 60, 90, 120, 180, 240]

/** "90" → "1 h 30", "60" → "1 h", "30" → "30 min". */
export function formatDuration(min: number): string {
  if (!min) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m}` : `${h} h`
}

/** Selector de duración libre: chips rápidos + campo de minutos editable.
 * El input guarda el texto crudo para que siempre se pueda borrar/editar. */
export function DurationPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (minutes: number) => void
}) {
  const [raw, setRaw] = React.useState(value ? String(value) : '')
  const current = Number(raw)

  function pick(n: number) {
    setRaw(String(n))
    onChange(n)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setRaw(v)
    const n = Number(v)
    onChange(v === '' || Number.isNaN(n) ? 0 : n)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              current === p
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {formatDuration(p)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          value={raw}
          onChange={handleInput}
          placeholder="60"
          className="w-24"
          aria-label="Duración en minutos"
        />
        <span className="text-sm text-muted-foreground">minutos</span>
      </div>
    </div>
  )
}
