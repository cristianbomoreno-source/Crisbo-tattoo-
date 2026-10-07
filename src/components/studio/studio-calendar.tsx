'use client'

import { useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'
import type { SessionWithProject } from '@/queries/sessions'
import type { TeamMember } from '@/actions/team'
import { cn } from '@/lib/utils'

type StudioSession = SessionWithProject & { artists: { id: string; name: string } | null }

const COLORS = [
  { dot: 'bg-emerald-400', text: 'text-emerald-400', ring: 'ring-emerald-400' },
  { dot: 'bg-sky-400', text: 'text-sky-400', ring: 'ring-sky-400' },
  { dot: 'bg-violet-400', text: 'text-violet-400', ring: 'ring-violet-400' },
  { dot: 'bg-amber-400', text: 'text-amber-400', ring: 'ring-amber-400' },
  { dot: 'bg-rose-400', text: 'text-rose-400', ring: 'ring-rose-400' },
  { dot: 'bg-cyan-400', text: 'text-cyan-400', ring: 'ring-cyan-400' },
]

function colorFor(artistId: string, order: string[]) {
  const idx = order.indexOf(artistId)
  return COLORS[idx % COLORS.length] ?? COLORS[0]!
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

export function StudioCalendar({
  sessions,
  team,
}: {
  sessions: StudioSession[]
  team: TeamMember[]
}) {
  const order = useMemo(() => team.map((m) => m.id), [team])
  const [active, setActive] = useState<Set<string>>(new Set(order))

  function toggle(artistId: string) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(artistId)) next.delete(artistId)
      else next.add(artistId)
      return next
    })
  }

  const visible = sessions.filter((s) => s.artist_id && active.has(s.artist_id) && s.status !== 'cancelled')

  const byDay = new Map<string, StudioSession[]>()
  for (const s of visible) {
    const key = s.scheduled_at.slice(0, 10)
    const list = byDay.get(key) ?? []
    list.push(s)
    byDay.set(key, list)
  }
  const days = [...byDay.keys()].sort()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap gap-2">
        {team.map((member) => {
          const color = colorFor(member.id, order)
          const isActive = active.has(member.id)
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => toggle(member.id)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-opacity',
                !isActive && 'opacity-40'
              )}
            >
              <span className={cn('size-2 rounded-full', color.dot)} />
              {member.name}
            </button>
          )
        })}
      </div>

      {days.length === 0 && (
        <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground">
          No hay sesiones agendadas en las próximas 3 semanas para los tatuadores seleccionados.
        </p>
      )}

      {days.map((day) => (
        <section key={day} className="rounded-2xl bg-card p-4">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {dayLabel(day)}
          </h3>
          <div className="space-y-1.5">
            {(byDay.get(day) ?? [])
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
              .map((s) => {
                const color = s.artist_id ? colorFor(s.artist_id, order) : COLORS[0]!
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl bg-background px-3.5 py-2.5">
                    <span className={cn('size-2 shrink-0 rounded-full', color.dot)} />
                    <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <Clock3 className="size-3" /> {timeLabel(s.scheduled_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.projects?.clients?.name ?? s.projects?.name ?? 'Sesión'}
                      </p>
                      <p className={cn('truncate text-xs', color.text)}>{s.artists?.name ?? 'Sin asignar'}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}
