import { cn } from '@/lib/utils'
import type { ArtistToday } from '@/queries/studio-home'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

export function WorkingTodayRow({ team }: { team: ArtistToday[] }) {
  if (team.length === 0) return null

  return (
    <div className="rounded-[1.75rem] bg-card p-4">
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Hoy trabajan
      </p>
      <div className="flex gap-4 overflow-x-auto px-1 pb-1">
        {team.map((member) => (
          <div key={member.artistId} className="flex shrink-0 flex-col items-center gap-1.5">
            <span className="relative grid size-12 place-items-center rounded-full bg-primary/15 font-title text-sm text-primary">
              {initials(member.name)}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-card',
                  member.presence === 'working' ? 'bg-emerald-400' : 'bg-muted-foreground/50'
                )}
              />
            </span>
            <span className="max-w-14 truncate text-center text-xs font-medium">{member.name}</span>
            {member.presence === 'off' && (
              <span className="text-[10px] text-muted-foreground">Descanso</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
