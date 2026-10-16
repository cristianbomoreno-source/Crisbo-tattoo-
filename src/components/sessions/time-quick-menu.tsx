'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { rescheduleSessionAction } from '@/actions/sessions'
import { formatTime } from '@/lib/calendar/utils'

const FIRST_HOUR = 7
const LAST_HOUR = 21

/** "HH:MM" cada 30 min de FIRST_HOUR a LAST_HOUR, más la hora actual si no cae en la grilla. */
function timeOptions(current: string) {
  const list: string[] = []
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    for (const m of ['00', '30']) list.push(`${String(h).padStart(2, '0')}:${m}`)
  }
  if (!list.includes(current)) list.push(current)
  return list.sort()
}

/** La hora de la cita como botón: al tocarla se despliega la lista de horas
 * del mismo día y elegir una mueve la cita (misma validación que Reagendar:
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
  const [saving, setSaving] = useState(false)
  const day = shown.slice(0, 10)
  const current = shown.slice(11, 16)

  async function pick(time: string) {
    if (time === current || saving) return
    const prev = shown
    const next = `${day}T${time}:00Z`
    setShown(next)
    setSaving(true)
    const res = await rescheduleSessionAction(
      sessionId,
      { scheduled_at: `${day}T${time}`, duration_minutes: durationMinutes },
      projectId
    )
    setSaving(false)
    if (!res.success) {
      setShown(prev)
      toast.error(res.error.message)
      return
    }
    toast.success(`Cita movida a las ${formatTime(next)}`)
    router.refresh()
  }

  return (
    // Los toques del menú (en portal) no deben llegar a la tarjeta que abre el proyecto.
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="contents">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={saving}
          aria-label="Cambiar hora de la cita"
          className={`group flex items-center gap-1.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${className}`}
        >
          <span className="font-title font-bold text-4xl leading-none tabular-nums">{formatTime(shown)}</span>
          <ChevronDown
            className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 w-40">
          {timeOptions(current).map((t) => (
            <DropdownMenuItem
              key={t}
              onClick={() => pick(t)}
              // Al abrir, la hora actual queda a la vista.
              ref={
                t === current
                  ? (el: HTMLElement | null) => {
                      const box = el?.parentElement
                      if (el && box) box.scrollTop = el.offsetTop - box.clientHeight / 2
                    }
                  : undefined
              }
              className="tabular-nums"
            >
              {formatTime(`${day}T${t}:00Z`)}
              {t === current && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
