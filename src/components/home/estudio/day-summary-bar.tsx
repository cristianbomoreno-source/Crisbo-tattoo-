import { CalendarCheck2, Users, Clock3, XCircle, Wallet } from 'lucide-react'

function formatCOP(amount: number) {
  return `$${Math.round(amount).toLocaleString('es-CO')}`
}

function Item({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: string
  label: string
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 px-3 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function DaySummaryBar({
  citasHoy,
  tatuadoresActivos,
  pendientes,
  canceladas,
  proyectado,
}: {
  citasHoy: number
  tatuadoresActivos: number
  pendientes: number
  canceladas: number
  proyectado: number
}) {
  return (
    <div className="flex flex-wrap divide-x divide-border/60 rounded-2xl bg-card">
      <Item icon={CalendarCheck2} value={String(citasHoy)} label="Citas totales" />
      <Item icon={Users} value={String(tatuadoresActivos)} label="Tatuadores activos" />
      <Item icon={Clock3} value={String(pendientes)} label="Pendientes" />
      <Item icon={XCircle} value={String(canceladas)} label="Cancelación" />
      <Item icon={Wallet} value={formatCOP(proyectado)} label="Ingresos proyectados" />
    </div>
  )
}
