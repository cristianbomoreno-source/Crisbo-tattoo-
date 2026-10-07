import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArtistToday } from '@/queries/studio-home'

const STATUS_LABEL: Record<ArtistToday['status'], { text: string; className: string; dot: string }> = {
  in_session: { text: 'En sesión', className: 'text-sky-400', dot: 'bg-sky-400' },
  available: { text: 'Disponible', className: 'text-emerald-400', dot: 'bg-emerald-400' },
  next_appointment: { text: 'Próxima cita', className: 'text-amber-400', dot: 'bg-amber-400' },
  off: { text: 'Descanso', className: 'text-muted-foreground', dot: 'bg-muted-foreground/50' },
}

export function TeamStatusCard({ team }: { team: ArtistToday[] }) {
  return (
    <section className="rounded-[1.75rem] bg-card p-5">
      <h2 className="mb-3 font-title text-base uppercase leading-none">Estado de tatuadores</h2>
      <div className="space-y-1">
        {team.map((member) => {
          const status = STATUS_LABEL[member.status]
          const secondary =
            member.status === 'off'
              ? 'Todo el día'
              : member.status === 'in_session'
                ? member.scheduleLabel
                : member.nextLabel
                  ? `Próxima cita ${member.nextLabel}`
                  : member.scheduleLabel

          return (
            <Link
              key={member.artistId}
              href="/dashboard/estudio/calendario"
              className="flex items-center gap-3 rounded-xl px-1.5 py-2.5 transition-colors hover:bg-accent/60"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 font-title text-xs text-primary">
                {member.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{member.name}</p>
                <p className="flex items-center gap-1.5 text-xs">
                  <span className={cn('size-1.5 rounded-full', status.dot)} aria-hidden="true" />
                  <span className={status.className}>{status.text}</span>
                  {secondary && <span className="text-muted-foreground">· {secondary}</span>}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
