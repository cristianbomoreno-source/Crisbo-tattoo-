import Link from 'next/link'
import { ArrowLeft, ChevronRight, Gift, Megaphone, Plus } from 'lucide-react'
import type { CampaignStats } from '@/queries/campaign-stats'
import { pct } from './campaign-charts'

/** Entrada de "Campañas": una tarjeta por campaña activa + crear campaña. */
export type HubBadge = { label: string; tone: 'active' | 'pending' | 'done' | 'off' }

const BADGE_TONE: Record<HubBadge['tone'], string> = {
  active: 'bg-income/15 text-income',
  pending: 'bg-amber-400/15 text-amber-700 dark:text-amber-300',
  done: 'bg-transfer/15 text-transfer',
  off: 'bg-muted text-muted-foreground',
}

export function CampaignHub({
  campaigns,
  badges = {},
  error,
}: {
  campaigns: CampaignStats[]
  /** Estado por campaña (slug); sin estado = "Activa". */
  badges?: Record<string, HubBadge>
  error: string | null
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 lg:hidden"
          aria-label="Volver a los chats"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold">Campañas</h2>
          <p className="text-xs text-muted-foreground">Toca una campaña para ver cómo le va</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {error && <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c) => {
            const reached = c.status.read + c.status.delivered + c.status.sent
            const Icon = c.kind === 'bono' ? Gift : Megaphone
            return (
              <Link
                key={c.slug}
                href={`/dashboard/inbox/campaigns/${c.slug}`}
                className="group space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5 transition hover:ring-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-sm font-semibold">{c.name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_TONE[(badges[c.slug] ?? { tone: 'active' }).tone]}`}
                      >
                        {badges[c.slug]?.label ?? 'Activa'}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/50 py-2">
                    <p className="font-display text-base font-semibold tabular-nums">{reached}</p>
                    <p className="text-[10px] text-muted-foreground">les llegó</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 py-2">
                    <p className="font-display text-base font-semibold tabular-nums text-primary">{c.replied}</p>
                    <p className="text-[10px] text-muted-foreground">respondieron · {pct(c.replied, reached)}%</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 py-2">
                    <p className="font-display text-base font-semibold tabular-nums text-income">
                      {c.bookings}
                    </p>
                    <p className="text-[10px] text-muted-foreground">citas nuevas</p>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct(reached, c.people)}%` }} />
                </div>
              </Link>
            )
          })}

          <Link
            href="/dashboard/inbox/campaigns/nueva"
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-center transition hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
              <Plus className="size-5" />
            </span>
            <p className="font-display text-sm font-semibold">Crear campaña</p>
            <p className="text-xs text-muted-foreground">
              Usa la plantilla comodín, una aprobada o crea una nueva y elige a quién enviarla.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
