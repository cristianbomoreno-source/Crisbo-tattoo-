'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { animate, AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { rescheduleSessionAction } from '@/actions/sessions'
import { formatTime, dayLabel } from '@/lib/calendar/utils'

/** Horas que ofrece la rueda (6 a. m. a 10 p. m.) y minutos de 5 en 5. */
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

// Geometría: un disco difuminado con el centro en el borde izquierdo de la
// pantalla; dentro, el arco de la rueda (círculo con centro fuera, a la
// izquierda) y, a la altura del punto activo, la hora en grande.
const RD = 380 // radio del disco
const CY = RD // centro vertical (el contenedor mide 2·RD de alto)
const R = 230 // radio del arco
const ARC_X = 104 // punto más a la derecha del arco
const CX = ARC_X - R
const STEP = 15 // grados entre un valor y el siguiente
const PX_PER_ITEM = 44 // cuánto hay que deslizar para pasar un valor
const SETTLE_MS = 450 // pausa tras soltar antes de pasar a los minutos

const pad = (n: number) => String(n).padStart(2, '0')
const h12 = (h: number) => h % 12 || 12
const ampm = (h: number) => (h < 12 ? 'a. m.' : 'p. m.')

function onArc(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

type Item = { label: string; suffix?: string }

/** Rueda en arco: se desliza arriba/abajo para cambiar el valor o se toca
 * uno del arco para ir directo. `onSettle` avisa cuando el usuario soltó y
 * la rueda quedó quieta (para pasar de horas a minutos). */
function ArcWheel({
  items,
  index,
  onIndex,
  onSettle,
}: {
  items: Item[]
  index: number
  onIndex: (i: number) => void
  onSettle?: () => void
}) {
  const [pos, setPos] = useState(index)
  const posRef = useRef(index)
  const drag = useRef<{ y: number; start: number } | null>(null)
  const anim = useRef<ReturnType<typeof animate> | null>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const last = useRef(index)
  const max = items.length - 1

  function setBoth(p: number) {
    const clamped = Math.max(-0.4, Math.min(max + 0.4, p))
    posRef.current = clamped
    setPos(clamped)
    const i = Math.max(0, Math.min(max, Math.round(clamped)))
    if (i !== last.current) {
      last.current = i
      onIndex(i)
      try {
        navigator.vibrate?.(4)
      } catch {}
    }
  }

  function stopAll() {
    anim.current?.stop()
    if (settle.current) clearTimeout(settle.current)
  }

  function snapTo(i: number) {
    const target = Math.max(0, Math.min(max, i))
    stopAll()
    anim.current = animate(posRef.current, target, { type: 'spring', stiffness: 380, damping: 34, onUpdate: setBoth })
    last.current = target
    onIndex(target)
    if (onSettle) settle.current = setTimeout(onSettle, SETTLE_MS)
  }

  useEffect(() => stopAll, [])

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => {
        stopAll()
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
        drag.current = { y: e.clientY, start: posRef.current }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        // Deslizar hacia arriba avanza (más tarde), como girar la rueda.
        setBoth(d.start - (e.clientY - d.y) / PX_PER_ITEM)
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
      <svg width="100%" height="100%" className="absolute inset-0 overflow-visible" aria-hidden="true">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={1.5} />
        {items.map((it, i) => {
          const deg = (i - pos) * STEP
          if (Math.abs(deg) > 80) return null
          const p = onArc(deg, R)
          const active = Math.abs(i - pos) < 0.5
          return (
            <circle
              key={it.label + (it.suffix ?? '')}
              cx={p.x}
              cy={p.y}
              r={active ? 5 : 3}
              fill={active ? 'var(--primary)' : 'var(--muted-foreground)'}
              opacity={active ? 1 : 0.5}
            />
          )
        })}
      </svg>

      {items.map((it, i) => {
        const off = i - pos
        const deg = off * STEP
        if (Math.abs(deg) > 75 || Math.abs(off) < 0.5) return null
        const p = onArc(deg, R + 44)
        return (
          <button
            key={it.label + (it.suffix ?? '')}
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => snapTo(i)}
            className="absolute flex items-baseline gap-0.5 font-title font-bold text-muted-foreground/50 tabular-nums"
            style={{
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
              opacity: Math.max(0, 1 - Math.abs(deg) / 80),
              fontSize: 30,
            }}
          >
            {it.label}
            {it.suffix && <span className="text-[10px] font-semibold">{it.suffix}</span>}
          </button>
        )
      })}
    </div>
  )
}

const noopSubscribe = () => () => {}

const HOUR_ITEMS: Item[] = HOURS.map((h) => ({ label: pad(h12(h)), suffix: h < 12 ? 'am' : 'pm' }))

/** La hora de la cita como botón: al tocarla se despliega desde la
 * izquierda un disco difuminado con la rueda de horas; al soltar en una
 * hora pasa a la rueda de minutos, y "Guardar" mueve la cita ese mismo día
 * (misma validación que Reagendar). `scheduled_at` es hora de pared "en UTC". */
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
  // El portal solo existe en el navegador (no en el render del servidor).
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false)
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
  const [step, setStep] = useState<'hour' | 'minute'>('hour')
  const [hourIdx, setHourIdx] = useState(0)
  const [minuteIdx, setMinuteIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  const minutes = MINUTES.includes(curM) ? MINUTES : [...MINUTES, curM].sort((a, b) => a - b)
  const minuteItems: Item[] = minutes.map((m) => ({ label: pad(m) }))
  const hour = HOURS[hourIdx] ?? curH
  const minute = minutes[minuteIdx] ?? 0

  function openWheel() {
    const i = HOURS.indexOf(curH)
    setHourIdx(i >= 0 ? i : 0)
    setMinuteIdx(Math.max(0, minutes.indexOf(curM)))
    setStep('hour')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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

  // El disco: opaco en el centro y difuminado hacia el borde, para que se
  // alcance a ver la pantalla detrás.
  const disc =
    'radial-gradient(closest-side, color-mix(in oklab, var(--card) 94%, transparent) 0%, color-mix(in oklab, var(--card) 88%, transparent) 68%, color-mix(in oklab, var(--card) 45%, transparent) 86%, transparent 100%)'

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="time-wheel"
          className="fixed inset-0 z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
        >
          {/* Fondo apenas oscurecido: se sigue viendo la app. Tocarlo cierra. */}
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cambiar hora"
            className="absolute left-0 top-1/2 -translate-y-1/2"
            style={{ width: `min(100vw, ${RD}px)`, height: RD * 2 }}
            initial={{ clipPath: `circle(0px at 0px ${CY}px)` }}
            animate={{ clipPath: `circle(${RD}px at 0px ${CY}px)` }}
            exit={{ clipPath: `circle(0px at 0px ${CY}px)` }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              aria-hidden="true"
              className="absolute rounded-full backdrop-blur-[2px]"
              style={{ left: -RD, top: CY - RD, width: RD * 2, height: RD * 2, background: disc }}
            />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="absolute inset-0"
                initial={{ opacity: 0, rotate: step === 'minute' ? 12 : -12 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: step === 'minute' ? -12 : 12 }}
                transition={{ duration: 0.22 }}
                style={{ transformOrigin: `${CX}px ${CY}px` }}
              >
                {step === 'hour' ? (
                  <ArcWheel items={HOUR_ITEMS} index={hourIdx} onIndex={setHourIdx} onSettle={() => setStep('minute')} />
                ) : (
                  <ArcWheel items={minuteItems} index={minuteIdx} onIndex={setMinuteIdx} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Encabezado */}
            <div className="pointer-events-none absolute left-6" style={{ top: CY - 170 }}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                {step === 'hour' ? 'Elige la hora' : 'Elige los minutos'}
              </p>
              <p className="text-sm capitalize text-muted-foreground">{dayLabel(day)}</p>
            </div>

            {/* Hora elegida en grande, a la altura del punto activo. */}
            <div
              className="absolute flex items-center gap-3"
              style={{ left: ARC_X + 22, top: CY, transform: 'translateY(-50%)' }}
            >
              <div className="flex items-baseline font-title font-bold leading-none tabular-nums">
                <button
                  type="button"
                  onClick={() => setStep('hour')}
                  className={`text-6xl transition-colors ${step === 'hour' ? 'text-foreground' : 'text-muted-foreground/60'}`}
                >
                  {pad(h12(hour))}
                </button>
                <span className="text-4xl text-muted-foreground/60">:</span>
                <button
                  type="button"
                  onClick={() => setStep('minute')}
                  className={`text-4xl transition-colors ${step === 'minute' ? 'text-foreground' : 'text-muted-foreground/60'}`}
                >
                  {pad(minute)}
                </button>
              </div>
              <p className="text-base font-bold text-primary">{ampm(hour)}</p>
            </div>

            {/* Acciones */}
            <div className="absolute flex items-center gap-2" style={{ left: ARC_X + 22, top: CY + 56 }}>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    // Toques y deslizamientos del disco (en portal) no deben llegar a la
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
      {isClient && createPortal(overlay, document.body)}
    </div>
  )
}
