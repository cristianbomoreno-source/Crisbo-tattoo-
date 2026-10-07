import { AlertTriangle } from 'lucide-react'
import type { AgendaAlert } from '@/queries/studio-home'

const ICONS: Record<AgendaAlert['kind'], string> = {
  missing_consent: '⚠️',
  pending_payment: '⚠️',
  starting_soon: '⏰',
}

export function AlertsCard({ alerts }: { alerts: AgendaAlert[] }) {
  if (alerts.length === 0) return null

  return (
    <section className="rounded-[1.75rem] border border-amber-400/20 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-title text-base uppercase leading-none text-amber-400">
          Alertas importantes
        </h2>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 6).map((alert) => (
          <div key={alert.id} className="flex items-start gap-2.5 rounded-xl bg-background px-3.5 py-2.5">
            <span aria-hidden="true" className="shrink-0 text-sm">
              {ICONS[alert.kind]}
            </span>
            <div className="min-w-0">
              <p className="text-sm">{alert.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
