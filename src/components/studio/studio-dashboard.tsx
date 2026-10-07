import Link from 'next/link'
import { Wallet, Clock3, Users, CalendarCheck2, Trophy } from 'lucide-react'
import type { StudioDashboardData } from '@/queries/studio-dashboard'

function formatCOP(amount: number) {
  return `$${Math.round(amount).toLocaleString('es-CO')}`
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function StudioDashboard({ data }: { data: StudioDashboardData }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard icon={Wallet} label="Facturado este mes" value={formatCOP(data.billedThisMonth)} />
        <MetricCard icon={Clock3} label="Pendiente por cobrar" value={formatCOP(data.pendingThisMonth)} />
        <MetricCard icon={Users} label="Tatuadores activos" value={String(data.teamSize)} />
        <MetricCard icon={CalendarCheck2} label="Sesiones hoy" value={String(data.sessionsToday)} />
        <MetricCard icon={Trophy} label="Proyectos activos" value={String(data.activeProjects)} />
      </div>

      <section className="rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-title text-lg uppercase">Ranking de tatuadores</h2>
          <Link href="/dashboard/settings/equipo" className="text-xs text-primary">
            Ver equipo
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {data.ranking.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay tatuadores con actividad este mes.</p>
          )}
          {data.ranking.map((row, i) => (
            <div key={row.artistId} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.activeProjects} activos · {row.completedProjects} completados
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCOP(row.billed)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
