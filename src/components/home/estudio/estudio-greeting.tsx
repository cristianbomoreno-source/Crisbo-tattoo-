import Link from 'next/link'
import { Search, ChevronDown } from 'lucide-react'
import { NotificationBell } from '@/components/home/notification-bell'

export function EstudioGreeting({
  studioName,
  greeting,
  dateLabel,
  logoUrl,
  alertCount,
}: {
  studioName: string
  greeting: string
  dateLabel: string
  logoUrl?: string | null
  alertCount: number
}) {
  const initial = studioName.charAt(0).toUpperCase() || 'O'

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg text-muted-foreground">{greeting}</p>
          <h1 className="-mt-1 flex items-center gap-1.5 truncate font-title text-2xl uppercase leading-[1.05] tracking-[0.01em] sm:text-3xl">
            <span className="truncate">{studioName}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} aria-hidden="true" />
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{dateLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/dashboard/clients"
            aria-label="Buscar"
            className="grid size-11 place-items-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
          >
            <Search className="size-5" strokeWidth={1.8} />
          </Link>

          <NotificationBell />

          <Link href="/dashboard/settings/perfil" aria-label="Tu estudio">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-11 rounded-full object-cover ring-2 ring-primary/70"
              />
            ) : (
              <span className="grid size-11 place-items-center rounded-full bg-primary/15 font-title text-lg text-primary ring-2 ring-primary/40">
                {initial}
              </span>
            )}
          </Link>
        </div>
      </div>

      {alertCount > 0 && (
        <p className="text-sm font-medium text-amber-400">🔔 {alertCount} alertas</p>
      )}
    </div>
  )
}
