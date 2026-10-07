'use client'

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { nowAsWallClock } from '@/lib/calendar/utils'
import type { ArtistToday, StudioSession } from '@/queries/studio-home'

const STATUS_STYLES: Record<string, { border: string; icon: string; label: string }> = {
  scheduled_future: { border: 'border-l-emerald-400', icon: '🟢', label: 'Confirmada' },
  rescheduled: { border: 'border-l-amber-400', icon: '🟡', label: 'Pendiente' },
  in_progress: { border: 'border-l-sky-400', icon: '🔵', label: 'En sesión' },
  completed: { border: 'border-l-muted-foreground/40', icon: '⚪', label: 'Finalizada' },
  cancelled: { border: 'border-l-red-500', icon: '🔴', label: 'Cancelada' },
}

function sessionVisualStatus(s: StudioSession, nowMs: number): keyof typeof STATUS_STYLES {
  if (s.status === 'cancelled') return 'cancelled'
  if (s.status === 'completed') return 'completed'
  if (s.status === 'rescheduled') return 'rescheduled'
  const start = new Date(s.scheduled_at).getTime()
  const end = start + (s.duration_minutes ?? 60) * 60000
  if (nowMs >= start && nowMs < end) return 'in_progress'
  return 'scheduled_future'
}

/** Hora-de-pared guardada (componentes UTC — MISMA convención que el resto
 * del calendario, ver `calendar/utils.ts`). Antes usaba `.getHours()` (hora
 * LOCAL del navegador): con el navegador en Bogotá (UTC-5) eso restaba 5h
 * de más sobre la hora ya guardada como si fuera UTC, y cada cita aparecía
 * 5 filas más arriba de lo que le correspondía en la grilla. */
function hourOf(iso: string) {
  return new Date(iso).getUTCHours()
}

function formatCOP(amount: number) {
  return `$${Math.round(amount).toLocaleString('es-CO')}`
}

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12
  const suffix = hour < 12 ? 'AM' : 'PM'
  return { h: String(h).padStart(2, '0'), suffix }
}

/**
 * Vista "tipo calendario" del estudio completo: columnas = tatuadores,
 * filas = hora del día, celdas = tarjetas compactas de cita. Reemplaza la
 * necesidad de abrir otra pantalla para ver quién tiene qué — todo cabe en
 * una sola grilla, como pide el mockup ("no listas, no tarjetas enormes").
 */
export function EstudioAgendaGrid({ team }: { team: ArtistToday[] }) {
  const workingTeam = useMemo(() => team.filter((t) => t.presence === 'working'), [team])
  const [view, setView] = useState<'general' | string>('general')
  const nowMs = nowAsWallClock().getTime()

  const visibleTeam = view === 'general' ? team : team.filter((t) => t.artistId === view)

  const hours = useMemo(() => {
    const allSessions = team.flatMap((t) => t.sessions)
    if (allSessions.length === 0) return Array.from({ length: 11 }, (_, i) => 8 + i) // 8am–6pm
    const min = Math.min(9, ...allSessions.map((s) => hourOf(s.scheduled_at)))
    const max = Math.max(19, ...allSessions.map((s) => hourOf(s.scheduled_at) + 1))
    return Array.from({ length: max - min }, (_, i) => min + i)
  }, [team])

  if (team.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground">
        Todavía no tienes tatuadores activos en el equipo.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="font-title text-lg uppercase leading-none">Agenda general</h2>
          <Info className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        </div>
        <Select value={view} onValueChange={(v) => v !== null && setView(v)}>
          <SelectTrigger className="h-9 w-auto min-w-36 gap-2 rounded-xl bg-card text-xs">
            <SelectValue placeholder="Vista">
              {view === 'general' ? 'Vista: General' : `Vista: ${team.find((t) => t.artistId === view)?.name ?? ''}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            {workingTeam.map((t) => (
              <SelectItem key={t.artistId} value={t.artistId}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] bg-card">
        <div
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `4.5rem repeat(${visibleTeam.length}, minmax(9rem, 1fr))` }}
        >
          {/* Header: HORA + una columna por tatuador con sus stats */}
          <div className="sticky left-0 z-10 flex items-end border-b border-border/60 bg-card px-2 pb-2.5 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Hora
            </span>
          </div>
          {visibleTeam.map((member) => (
            <div key={member.artistId} className="border-b border-l border-border/60 px-3 pb-3 pt-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 font-title text-xs text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <p className="truncate text-sm font-semibold">{member.name}</p>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {member.sessionCount} citas • {formatCOP(member.projectedIncome)}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, member.sessionCount === 0 ? 0 : (member.sessionCount / Math.max(...team.map((t) => t.sessionCount), 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}

          {/* Filas por hora */}
          {hours.map((hour) => {
            const { h, suffix } = hourLabel(hour)
            return (
              <div key={hour} className="contents">
                <div className="sticky left-0 z-10 flex flex-col items-start justify-start border-b border-border/40 bg-card px-2 py-2.5">
                  <span className="text-xs font-semibold tabular-nums">{h}:00</span>
                  <span className="text-[10px] text-muted-foreground">{suffix}</span>
                </div>
                {visibleTeam.map((member) => {
                  const cellSessions = member.sessions.filter((s) => hourOf(s.scheduled_at) === hour)
                  return (
                    <div
                      key={member.artistId + hour}
                      className="border-b border-l border-border/40 p-1.5"
                    >
                      {cellSessions.map((s) => {
                        const vs = sessionVisualStatus(s, nowMs)
                        // sessionVisualStatus solo retorna claves definidas arriba en STATUS_STYLES.
                        const style = STATUS_STYLES[vs]!
                        return (
                          <div
                            key={s.id}
                            className={cn(
                              'rounded-lg border-l-[3px] bg-background px-2.5 py-1.5',
                              style.border
                            )}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="truncate text-xs font-semibold">{s.projects?.name ?? 'Sesión'}</p>
                              <span aria-hidden="true" className="shrink-0 text-[10px]">
                                {style.icon}
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {s.projects?.clients?.name ?? 'Cliente'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
