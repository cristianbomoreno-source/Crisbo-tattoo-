'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { startWorkShift, endWorkShift } from '@/actions/work-shifts'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** HH:MM:SS transcurridas desde `startedAt` hasta ahora. */
function useElapsed(startedAt: string | null): { h: string; m: string; s: string } {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt) return { h: '00', m: '00', s: '00' }
  const totalSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h: pad(h), m: pad(m), s: pad(s) }
}

/**
 * Tarjeta "Iniciar sesión" del Home en iPad/escritorio (portada, alineada a
 * la derecha). Recibe la jornada abierta (si hay una) ya resuelta en el
 * servidor (`getActiveWorkShift`) y solo lleva el reloj en el cliente —
 * `started_at` real vive en `work_shifts`, así que sobrevive a un refresh.
 */
export function WorkShiftCard({
  activeShift,
}: {
  activeShift: { id: string; startedAt: string } | null
}) {
  const router = useRouter()
  const [shift, setShift] = useState(activeShift)
  const [busy, setBusy] = useState(false)
  const { h, m, s } = useElapsed(shift?.startedAt ?? null)

  async function onStart() {
    setBusy(true)
    const result = await startWorkShift()
    setBusy(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    setShift({ id: result.data.id, startedAt: result.data.startedAt })
    router.refresh()
  }

  async function onEnd() {
    if (!shift) return
    setBusy(true)
    const result = await endWorkShift(shift.id)
    setBusy(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Jornada finalizada')
    setShift(null)
    router.refresh()
  }

  return (
    <div className="w-[280px] shrink-0 rounded-[1.75rem] border border-white/10 bg-black/70 p-6 text-center backdrop-blur-md">
      <p className="text-xs text-white/60">
        {shift ? 'Jornada en curso' : 'Aún no has iniciado tu jornada.'}
      </p>

      <div className="mt-3 flex items-center justify-center gap-1 font-title text-4xl tabular-nums text-white">
        <span>{h}</span>
        <span className="text-white/30">:</span>
        <span>{m}</span>
        <span className="text-white/30">:</span>
        <span>{s}</span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-6 text-[10px] uppercase tracking-wide text-white/40">
        <span>Horas</span>
        <span>Minutos</span>
        <span>Segundos</span>
      </div>

      {shift ? (
        <button
          type="button"
          onClick={onEnd}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-50"
        >
          <Square className="size-4" strokeWidth={2} aria-hidden="true" />
          Finalizar jornada
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Play className="size-4" strokeWidth={2} aria-hidden="true" />
          Iniciar sesión
        </button>
      )}
      {!shift && (
        <p className="mt-3 text-[11px] text-white/40">Inicia tu jornada para registrar el tiempo trabajado.</p>
      )}
    </div>
  )
}
