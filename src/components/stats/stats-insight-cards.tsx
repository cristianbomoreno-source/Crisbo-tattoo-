import { Donut } from '@/components/stats/charts'
import type { Client } from '@/queries/clients'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Clientes del mes: nuevos contra recurrentes, con las caras de los primeros. */
export function StatsClientsCard({ newClients, recurringClients }: { newClients: Client[]; recurringClients: Client[] }) {
  const total = newClients.length + recurringClients.length
  const shown = [...newClients, ...recurringClients].slice(0, 5)

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Clientes</h2>
      <div className="mt-3 flex items-center gap-4">
        <Donut
          segments={[
            { label: 'Nuevos', value: newClients.length, color: 'var(--primary)' },
            { label: 'Recurrentes', value: recurringClients.length, color: 'var(--chart-3)' },
          ]}
          size={104}
          thickness={14}
          label={`${newClients.length} nuevos, ${recurringClients.length} recurrentes`}
        >
          <span className="font-title text-xl font-bold tabular-nums">{total}</span>
        </Donut>
        <div className="min-w-0 flex-1 space-y-2.5">
          <ul className="space-y-1.5 text-[13px]">
            <li className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="flex-1">Nuevos</span>
              <span className="tabular-nums text-muted-foreground">{newClients.length}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-chart-3" aria-hidden />
              <span className="flex-1">Recurrentes</span>
              <span className="tabular-nums text-muted-foreground">{recurringClients.length}</span>
            </li>
          </ul>
          {shown.length > 0 && (
            <div className="flex -space-x-2">
              {shown.map((c) => (
                <span
                  key={c.id}
                  title={c.name}
                  className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-card bg-muted text-[11px] font-semibold"
                >
                  {initials(c.name)}
                </span>
              ))}
              {total > shown.length && (
                <span className="grid h-8 shrink-0 place-items-center rounded-full border-2 border-card bg-muted px-2 text-[11px] tabular-nums text-muted-foreground">
                  +{total - shown.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
