'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Preset = {
  label: string
  from: string
  to: string
}

function getPresets(): Preset[] {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()

  // Este mes
  const thisMonthStart = new Date(y, m, 1)
  const thisMonthEnd = new Date(y, m + 1, 0)

  // Mes pasado
  const lastMonthStart = new Date(y, m - 1, 1)
  const lastMonthEnd = new Date(y, m, 0)

  // Últimos 3 meses
  const threeMonthsStart = new Date(y, m - 2, 1)

  // Este año
  const yearStart = new Date(y, 0, 1)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  return [
    { label: 'Este mes', from: fmt(thisMonthStart), to: fmt(thisMonthEnd) },
    { label: 'Mes pasado', from: fmt(lastMonthStart), to: fmt(lastMonthEnd) },
    { label: 'Últimos 3 meses', from: fmt(threeMonthsStart), to: fmt(thisMonthEnd) },
    { label: 'Este año', from: fmt(yearStart), to: fmt(thisMonthEnd) },
  ]
}

export function FinanceDateFilter({
  currentFrom,
  currentTo,
}: {
  currentFrom: string
  currentTo: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCustom, setShowCustom] = React.useState(false)
  const [from, setFrom] = React.useState(currentFrom)
  const [to, setTo] = React.useState(currentTo)

  const presets = getPresets()

  const currentPreset = presets.find((p) => p.from === currentFrom && p.to === currentTo)
  const label = currentPreset?.label ?? `${formatDate(currentFrom)} - ${formatDate(currentTo)}`

  function applyFilter(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', newFrom)
    params.set('to', newTo)
    router.push(`?${params.toString()}`)
    setShowCustom(false)
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (from && to) {
      applyFilter(from, to)
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Calendar className="size-4" />
        <span>Periodo del reporte</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={currentPreset?.label === preset.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyFilter(preset.from, preset.to)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={!currentPreset ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="text-xs"
        >
          Personalizado
          <ChevronDown className={`ml-1 size-3 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showCustom && (
        <form onSubmit={handleCustomSubmit} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="block h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="block h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
              required
            />
          </div>
          <Button type="submit" size="sm">
            Aplicar
          </Button>
        </form>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Mostrando: <span className="text-white font-medium">{label}</span>
      </p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}
