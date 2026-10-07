import { ShoppingBag } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { OccupancyRing } from '@/components/home/occupancy-ring'
import type { Client } from '@/queries/clients'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-white"
      title={name}
    >
      {initials(name)}
    </span>
  )
}

export function StatsInsightCards({
  conversionPct,
  expectedIncome,
  newClients,
  recurringClients,
  averageTicket,
  prevAverageTicket,
}: {
  conversionPct: number | null
  expectedIncome: number
  newClients: Client[]
  recurringClients: Client[]
  averageTicket: number
  prevAverageTicket: number
}) {
  const ticketDelta =
    prevAverageTicket > 0 ? Math.round(((averageTicket - prevAverageTicket) / prevAverageTicket) * 100) : null
  const shownClients = [...newClients, ...recurringClients].slice(0, 4)
  const overflow = newClients.length + recurringClients.length - shownClients.length

  return (
    <section className="grid grid-cols-2 gap-3">
      {/* Conversión */}
      <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Conversión
        </p>
        {conversionPct === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Aún no hay solicitudes este mes.</p>
        ) : (
          <>
            <div className="mt-2 flex justify-center">
              <OccupancyRing pct={conversionPct} />
            </div>
            <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
              De cada 100 solicitudes, {conversionPct} se convierten en proyectos aprobados.
            </p>
          </>
        )}
      </div>

      {/* Ingresos esperados */}
      <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Ingresos esperados
        </p>
        <p className="mt-2 font-title text-2xl tabular-nums text-primary">{cop(expectedIncome)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Proyección del mes</p>
        <p className="mt-3 text-xs text-muted-foreground">Basado en cotizaciones aprobadas y pendientes.</p>
      </div>

      {/* Clientes */}
      <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Clientes
        </p>
        <p className="mt-2 font-title text-2xl tabular-nums text-white">{newClients.length}</p>
        <p className="text-xs text-muted-foreground">Nuevos este mes</p>
        <p className="mt-2 font-title text-xl tabular-nums text-white">{recurringClients.length}</p>
        <p className="text-xs text-muted-foreground">Recurrentes</p>
        {shownClients.length > 0 && (
          <div className="mt-3 flex items-center">
            <div className="flex -space-x-2">
              {shownClients.map((c) => (
                <Avatar key={c.id} name={c.name} />
              ))}
            </div>
            {overflow > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">+{overflow}</span>
            )}
          </div>
        )}
      </div>

      {/* Ticket promedio */}
      <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
        <span className="grid size-9 place-items-center rounded-full bg-primary/10">
          <ShoppingBag className="size-4 text-primary" aria-hidden />
        </span>
        <p className="mt-3 font-title text-2xl tabular-nums text-white">{cop(averageTicket)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Valor promedio por proyecto</p>
        {ticketDelta !== null && (
          <p
            className={`mt-1 text-[11px] tabular-nums ${
              ticketDelta > 0 ? 'text-[color:var(--success)]' : ticketDelta < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {ticketDelta > 0 ? '↑' : ticketDelta < 0 ? '↓' : ''} {Math.abs(ticketDelta)}% vs. mes anterior
          </p>
        )}
      </div>
    </section>
  )
}
