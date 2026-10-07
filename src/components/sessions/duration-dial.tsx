'use client'

import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

const SIZE = 260
const R = 104
const CENTER = SIZE / 2
const TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

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

const MAX_MINUTES = 12 * 60

/**
 * Dial circular de duración (estilo apps de reservas): arrastra el punto y,
 * al completar una vuelta, suma una hora sola (sigues girando y van
 * sumando 2, 3…) — no se "pierde" el giro al pasar por las 12. El stepper
 * de horas de al lado hace lo mismo de un toque.
 */
export function DurationDial({
  value,
  onChange,
}: {
  value: number
  onChange: (minutes: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState(Math.floor(value / 60))
  const [mins, setMins] = useState(value % 60)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const lastAngleRef = useRef(0)
  const totalRef = useRef(value)

  function openDial() {
    setHours(Math.floor(value / 60))
    setMins(value % 60)
    setOpen(true)
  }

  function svgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: CENTER, y: CENTER }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    totalRef.current = hours * 60 + mins
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
    const snapped = Math.round(totalRef.current / 5) * 5
    setHours(Math.floor(snapped / 60))
    setMins(snapped % 60)
  }

  function onPointerUp() {
    dragging.current = false
  }

  function apply() {
    onChange(Math.max(5, hours * 60 + mins))
    setOpen(false)
  }

  const knobAngle = angleForMinutes(mins)
  const knob = pointOnCircle(knobAngle, R)
  const total = hours * 60 + mins

  return (
    <>
      <button
        type="button"
        onClick={openDial}
        className="flex w-full items-center justify-between rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-sm transition-colors hover:border-primary/40"
      >
        <span className="text-muted-foreground">Duración</span>
        <span className="font-medium">
          {value >= 60 ? `${Math.floor(value / 60)} h ${value % 60 ? value % 60 : ''}`.trim() : `${value} min`}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogTitle>Seleccionar duración</DialogTitle>

          <div className="flex items-center justify-center gap-3 py-2">
            <button
              type="button"
              aria-label="Menos horas"
              onClick={() => setHours((h) => Math.max(0, h - 1))}
              className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums">
              {hours} {hours === 1 ? 'hora' : 'horas'}
            </span>
            <button
              type="button"
              aria-label="Más horas"
              onClick={() => setHours((h) => Math.min(12, h + 1))}
              className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto touch-none select-none"
            width={SIZE}
            height={SIZE}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="var(--border)" strokeWidth={10} />
            <path
              d={describeArc(0, knobAngle)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={10}
              strokeLinecap="round"
            />
            {TICKS.map((t) => {
              const p = pointOnCircle(angleForMinutes(t), R + 22)
              return (
                <text
                  key={t}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[13px]"
                >
                  {t}
                </text>
              )
            })}
            <circle cx={knob.x} cy={knob.y} r={14} fill="var(--primary)" />
            <text
              x={CENTER}
              y={CENTER - 6}
              textAnchor="middle"
              className="fill-foreground text-[34px] font-semibold tabular-nums"
            >
              {total}
            </text>
            <text x={CENTER} y={CENTER + 20} textAnchor="middle" className="fill-muted-foreground text-[13px]">
              min.
            </text>
          </svg>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Salir
            </Button>
            <Button type="button" className="flex-1" onClick={apply}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Arco SVG del anillo de progreso, de 0 a `endDeg` (grados, 0 = arriba). */
function describeArc(startDeg: number, endDeg: number) {
  if (endDeg <= 0.01) return ''
  const start = pointOnCircle(startDeg, R)
  const end = pointOnCircle(endDeg, R)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`
}
