'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { animate } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { rescheduleSessionAction } from '@/actions/sessions'
import { formatTime, dayLabel } from '@/lib/calendar/utils'

/** Horas que ofrece la rueda (6 a. m. a 10 p. m.). */
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6)
const MINUTES = [0, 15, 30, 45]

// Geometría de la rueda: un círculo grande con el centro fuera, a la
// izquierda; las horas van sobre el arco y la elegida queda a la altura del
// número grande.
const H = 340
const CY = H / 2
const R = 230
const ARC_X = 96 // punto más a la derecha del arco
const CX = ARC_X - R
const STEP = 15 // grados entre una hora y la siguiente
const PX_PER_ITEM = 46 // cuánto hay que deslizar para pasar una hora

const pad = (n: number) => String(n).padStart(2, '0')
const h12 = (h: number) => h % 12 || 12
const ampm = (h: number) => (h < 12 ? 'a. m.' : 'p. m.')

function onArc(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

/** Rueda en arco: se desliza arriba/abajo para cambiar la hora (pasando de
 * a. m. a p. m.), o se toca una hora del arco para ir directo a ella. */
function HourWheel({ index, onIndex }: { index: number; onIndex: (i: number) => void }) {
  const [pos, setPos] = useState(index)
  const posRef = useRef(index)
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null)
  const anim = useRef<ReturnType<typeof animate> | null>(null)
  const last = useRef(index)

  function setBoth(p: number) {
    const clamped = Math.max(-0.4, Math.min(HOURS.length - 0.6, p))
    posRef.current = clamped
    setPos(clamped)
    const i = Math.max(0, Math.min(HOURS.length - 1, Math.round(clamped)))
    if (i !== last.current) {
      last.current = i
      try {
        navigator.vibrate?.(4)
      } catch {}
    }
  }

  function snapTo(i: number) {
    const target = Math.max(0, Math.min(HOURS.length - 1, i))
    anim.current?.stop()
    anim.current = animate(posRef.current, target, {
      type: 'spring',
      stiffness: 380,
      damping: 34,
      onUpdate: setBoth,
    })
    last.current = target
    onIndex(target)
  }

  useEffect(() => () => anim.current?.stop(), [])

  return (
    <div
      className="relative w-full touch-none select-none overflow-hidden"
      style={{ height: H }}
      onPointerDown={(e) => {
        anim.current?.stop()
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
        drag.current = { y: e.clientY, start: posRef.current, moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const dy = e.clientY - d.y
        if (Math.abs(dy) > 4) d.moved = true
        // Deslizar hacia arriba avanza (más tarde), como girar la rueda.
        setBoth(d.start - dy / PX_PER_ITEM)
      }}
      onPointerUp={() => {
        if (!drag.current) return
        drag.current = null
        snapTo(Math.round(posRef.current))
      }}
      onPointerCancel={() => {
        drag.current = null
        snapTo(Math.round(posRef.current))
      }}
      onWheel={(e) => snapTo(Math.round(posRef.current) + (e.deltaY > 0 ? 1 : -1))}
    >
      <svg width="100%" height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={1.5} />
        {HOURS.map((h, i) => {
          const deg = (i - pos) * STEP
          if (Math.abs(deg) > 80) return null
          const p = onArc(deg, R)
          const active = Math.abs(i - pos) < 0.5
          return (
            <circle
              key={h}
              cx={p.x}
              cy={p.y}
              r={active ? 5 : 3}
              fill={active ? 'var(--primary)' : 'var(--muted-foreground)'}
              opacity={active ? 1 : 0.5}
            />
          )
        })}
      </svg>

      {HOURS.map((h, i) => {
        const off = i - pos
        const deg = off * STEP
        if (Math.abs(deg) > 75 || Math.abs(off) < 0.5) return null
        const p = onArc(deg, R + 44)
        return (
          <button
            key={h}
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => snapTo(i)}
            className="absolute flex items-baseline gap-0.5 font-title font-bold text-muted-foreground/45 tabular-nums"
            style={{
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
              opacity: Math.max(0, 1 - Math.abs(deg) / 80),
              fontSize: 30,
            }}
          >
            {pad(h12(h))}
            <span className="text-[10px] font-semibold">{h < 12 ? 'am' : 'pm'}</span>
          </button>
        )
      })}
    </div>
  )
}

/** La hora de la cita como botón: al tocarla abre la rueda de horas y al
 * guardar mueve la cita ese mismo día (misma validación que Reagendar:
 * choques, días bloqueados). `scheduled_at` es hora de pared "en UTC". */
export function TimeQuickMenu({
  sessionId,
  scheduledAt,
  durationMinutes,
  projectId,
  className = '',
}: {
  sessionId: string
  scheduledAt: string
  durationMinutes: number
  projectId?: string
  className?: string
}) {
  const router = useRouter()
  const [shown, setShown] = useState(scheduledAt)
  const [shownFor, setShownFor] = useState(`${sessionId}|${scheduledAt}`)
  if (shownFor !== `${sessionId}|${scheduledAt}`) {
    setShownFor(`${sessionId}|${scheduledAt}`)
    setShown(scheduledAt)
  }
  const day = shown.slice(0, 10)
  const curH = Number(shown.slice(11, 13))
  const curM = Number(shown.slice(14, 16))

  const [open, setOpen] = useState(false)
  const [hourIdx, setHourIdx] = useState(0)
  const [minute, setMinute] = useState(0)
  const [saving, setSaving] = useState(false)

  const minuteOptions = MINUTES.includes(curM) ? MINUTES : [...MINUTES, curM].sort((a, b) => a - b)
  const hour = HOURS[hourIdx] ?? curH

  function openWheel() {
    const i = HOURS.indexOf(curH)
    setHourIdx(i >= 0 ? i : 0)
    setMinute(curM)
    setOpen(true)
  }

  async function save() {
    const time = `${pad(hour)}:${pad(minute)}`
    if (hour === curH && minute === curM) {
      setOpen(false)
      return
    }
    setSaving(true)
    const res = await rescheduleSessionAction(
      sessionId,
      { scheduled_at: `${day}T${time}`, duration_minutes: durationMinutes },
      projectId
    )
    setSaving(false)
    if (!res.success) {
      toast.error(res.error.message)
      return
    }
    const next = `${day}T${time}:00Z`
    setShown(next)
    setOpen(false)
    toast.success(`Cita movida a las ${formatTime(next)}`)
    router.refresh()
  }

  return (
    // Toques y deslizamientos del popup (en portal) no deben llegar a la
    // tarjeta (abre el proyecto / cambia de cita al deslizar).
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="contents"
    >
      <button
        type="button"
        aria-label="Cambiar hora de la cita"
        onClick={openWheel}
        className={`group flex items-center gap-1.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        <span className="font-title font-bold text-4xl leading-none tabular-nums">{formatTime(shown)}</span>
        <ChevronDown
          className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm overflow-hidden p-0">
          <div className="px-5 pt-5">
            <DialogTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Cambiar hora
            </DialogTitle>
            <p className="mt-0.5 text-sm capitalize text-muted-foreground">{dayLabel(day)}</p>
          </div>

          <div className="relative">
            {open && <HourWheel index={hourIdx} onIndex={setHourIdx} />}
            {/* Hora elegida, a la altura del punto activo del arco. */}
            <div
              className="pointer-events-none absolute flex items-center gap-3"
              style={{ left: ARC_X + 26, top: CY, transform: 'translateY(-50%)' }}
            >
              <span className="font-title font-bold text-6xl leading-none tabular-nums">{pad(h12(hour))}</span>
              <div className="leading-tight">
                <p className="text-lg font-bold text-primary">{ampm(hour)}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {pad(h12(hour))}:{pad(minute)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-5 pb-5">
            <div className="flex gap-2">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinute(m)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold tabular-nums transition-colors ${
                    m === minute ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground hover:bg-accent/70'
                  }`}
                >
                  :{pad(m)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
