import Link from 'next/link'
import { firstName } from '@/lib/home/month-metrics'
import { NotificationBell } from '@/components/home/notification-bell'

export function HomeGreeting({
  name,
  greeting,
  dateLabel,
  logoUrl,
}: {
  name: string | null
  greeting: string
  dateLabel: string
  logoUrl?: string | null
}) {
  const who = name ? firstName(name) : null
  const initial = who ? who.charAt(0).toUpperCase() : 'O'

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-base text-muted-foreground">{greeting}</p>
        <h1 className="-mt-1 truncate font-title text-4xl leading-[0.95] tracking-[0.005em] text-primary sm:text-5xl">
          {who ?? 'OFINK'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <NotificationBell />

        <Link href="/dashboard/settings/perfil" aria-label="Tu perfil">
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
  )
}
