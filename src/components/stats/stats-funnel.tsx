import { Users, FileText, CheckCircle2, CalendarCheck, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FunnelStage } from '@/lib/stats/period-metrics'

const ICONS: LucideIcon[] = [Users, FileText, CheckCircle2, CalendarCheck, Star]

export function StatsFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Embudo de ventas
      </p>
      <div className="mt-4 flex flex-col">
        {stages.map((stage, i) => {
          const Icon = ICONS[i] ?? Star
          return (
            <div key={stage.label}>
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10">
                  <Icon className="size-4 text-primary" aria-hidden />
                </span>
                <span className="font-title text-xl tabular-nums text-white">{stage.count}</span>
                <span className="text-sm text-white/70">{stage.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="ml-[1.05rem] h-4 w-px bg-white/10" aria-hidden />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
