import Link from 'next/link'
import { CalendarCheck2, UserPlus, Wallet } from 'lucide-react'
import type { RecentActivityItem } from '@/queries/studio-home'

function iconFor(item: RecentActivityItem) {
  if (item.id.startsWith('client-')) return UserPlus
  if (item.id.startsWith('payment-')) return Wallet
  return CalendarCheck2
}

export function RecentActivityCard({ items }: { items: RecentActivityItem[] }) {
  return (
    <section className="rounded-[1.75rem] bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-title text-base uppercase leading-none">Actividad reciente</h2>
        <Link href="/dashboard/estudio/calendario" className="text-xs font-medium text-primary">
          Ver todo →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin actividad todavía hoy.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = iconFor(item)
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-xl px-1.5 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.message}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
