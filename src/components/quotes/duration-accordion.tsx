'use client'

import { useRef, useState } from 'react'
import { Clock, ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZE = 220
const R = 88
const CENTER = SIZE / 2
const TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const CHIPS: { label: string; minutes: number | null }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '1.5 horas', minutes: 90 },
  { label: '2 horas', minutes: 120 },
  { label: '2.5 horas', minutes: 150 },
  { label: '3 horas', minutes: 180 },
  { label: '4 horas', minutes: 240 },
  { label: '+4 horas', minutes: null },
]

function angleForMinutes(min: number) {
  return (min / 60) * 360
}

function pointOnCircle(deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function angleOf(x: number, y: number) {
  const dx = x - CENTER
  const dy = y - CENTER
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
  if (deg < 0) deg += 360
  return deg
}

function describeArc(startDeg: number, endDeg: number) {
  if (endDeg <= 0.01) return ''
  const start = pointOnCircle(startDeg, R)
  const end = pointOnCircle(endDeg, R)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function minutesToLabel(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} ${h === 1 ? 'hora' : 'horas'}`
  return `${h} h ${m} min`
}

/** Intenta reconocer un valor de texto libre existente ("1 hora", "2-3
 * horas", "90 min"…) como minutos, para poder abrir el reloj en el punto
 * correcto. Si no logra reconocerlo, usa 60 min por defecto — puramente
 * visual, no cambia lo que ya está guardado hasta que el usuario interactúe. */
function parseMinutes(value: string | undefined): number {
  if (!value) return 60
  const preset = CHIPS.find((c) => c.label === value)
  if (preset?.minutes) return preset.minutes
  const hMatch = value.match(/(\d+(?:[.,]\d+)?)\s*h/i)
  const mMatch = value.match(/(\d+)\s*min/i)
  if (hMatch) return Math.round(parseFloat(hMatch[1]!.replace(',', '.')) * 60)
  if (mMatch) return parseInt(mMatch[1]!, 10)
  const n = parseInt(value, 10)
  if (!Number.isNaN(n) && n > 0) return n
  return 60
}

const MAX_MINUTES = 12 * 60

/**
 * Reemplazo del input de texto libre para "Duración aproximada por sesión"
 * — mismo campo/lógica de siempre (recibe y devuelve un string), solo
 * cambia cómo se elige el valor: acordeón con chips rápidos + el mismo
 * reloj circular arrastrable del selector de citas del calendario
 * (duration-dial.tsx), embebido en línea en vez de en un diálogo aparte.
 */
export function DurationAccordion({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState(() => parseMinutes(value))
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const lastAngleRef = useRef(0)
  const totalRef = useRef(minutes)

  function commit(next: number) {
    const snapped = Math.min(MAX_MINUTES, Math.max(5, Math.round(next / 5) * 5))
    setMinutes(snapped)
    onChange(minutesToLabel(snapped))
  }

  function svgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: CENTER, y: CENTER }
    const rect = svg.getBoundingClientRect()
    return { x: ((clientX - rect.left) / rect.width) * SIZE, y: ((clientY - rect.top) / rect.height) * SIZE }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    totalRef.current = minutes
    const { x, y } = svgPoint(e.clientX, e.clientY)
    lastAngleRef.current = angleOf(x, y)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const { x, y } = svgPoint(e.clientX, e.clientY)
    const angle = angleOf(x, y)
    let delta = angle - lastAngleRef.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    lastAngleRef.current = angle
    totalRef.current = Math.min(MAX_MINUTES, Math.max(5, totalRef.current + (delta / 360) * 60))
    commit(totalRef.current)
  }

  function onPointerUp() {
    dragging.current = false
  }

  const activeChip = CHIPS.find((c) => c.label === value)?.label
  const knobAngle = angleForMinutes(minutes % 60)
  const knob = pointOnCircle(knobAngle, R)

  return (
    <div className="overflow-hidden rounded-3xl border border-[#2B2B2B] bg-[#171717]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-200 hover:bg-white/[0.02]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Clock className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Duración aproximada por sesión
          </span>
          <span className="mt-0.5 block truncate text-base font-medium text-white">
            {value || 'Sin definir'}
          </span>
        </span>
        <ChevronDown
          className={cn('size-5 shrink-0 text-primary transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-[#2B2B2B] p-4 pt-5">
            <div>
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">Selección rápida</p>
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((chip) => {
                  const active = activeChip === chip.label
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        onChange(chip.label)
                        if (chip.minutes) {
                          setMinutes(chip.minutes)
                          totalRef.current = chip.minutes
                        }
                      }}
                      className={cn(
                        'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200',
                        active
                          ? 'border-primary bg-primary text-black'
                          : 'border-[#2B2B2B] bg-[#0D0D0D] text-white/80 hover:border-primary/40'
                      )}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Personalizado</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Restar 5 minutos"
                  onClick={() => commit(minutes - 5)}
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-[#2B2B2B] text-white/70 transition-colors duration-200 hover:border-primary/50 hover:text-primary"
                >
                  <Minus className="size-4" aria-hidden />
                </button>

                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${SIZE} ${SIZE}`}
                  className="touch-none select-none"
                  width={SIZE}
                  height={SIZE}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="#2B2B2B" strokeWidth={10} />
                  <path d={describeArc(0, knobAngle)} fill="none" stroke="var(--primary)" strokeWidth={10} strokeLinecap="round" />
                  {TICKS.map((t) => {
                    const p = pointOnCircle(angleForMinutes(t), R + 20)
                    return (
                      <text key={t} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[12px]">
                        {t}
                      </text>
                    )
                  })}
                  <circle cx={knob.x} cy={knob.y} r={12} fill="var(--primary)" />
                  <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="fill-white text-[32px] font-semibold tabular-nums">
                    {minutes}
                  </text>
                  <text x={CENTER} y={CENTER + 20} textAnchor="middle" className="fill-muted-foreground text-[12px]">
                    min.
                  </text>
                </svg>

                <button
                  type="button"
                  aria-label="Sumar 5 minutos"
                  onClick={() => commit(minutes + 5)}
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-[#2B2B2B] text-white/70 transition-colors duration-200 hover:border-primary/50 hover:text-primary"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
