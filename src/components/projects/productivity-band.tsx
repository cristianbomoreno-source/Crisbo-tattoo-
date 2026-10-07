import type { ReactNode } from 'react'
import { Clock, Activity, CheckCircle2, Hourglass, type LucideIcon } from 'lucide-react'
import { deltaPct } from '@/lib/home/month-metrics'
import { formatHM, type Productivity } from '@/lib/projects/productivity'

function DeltaTag({ cur, prev }: { cur: number; prev: number }) {
  const pct = deltaPct(cur, prev)
  if (pct === null) return null
  const color =
    pct > 0 ? 'text-[color:var(--success)]' : pct < 0 ? 'text-destructive' : 'text-muted-foreground'
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : ''
  return (
    <p className={`mt-0.5 truncate text-[clamp(0.44rem,1.8vw,0.62rem)] tabular-nums ${color}`}>
      {arrow}
      {Math.abs(pct)}%
    </p>
  )
}

function Tile({
  icon: Icon,
  iconClass,
  label,
  value,
  delta,
}: {
  icon: LucideIcon
  iconClass: string
  label: string
  value: ReactNode
  delta: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl bg-muted/40 p-2.5 text-center sm:p-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-card sm:size-11 ${iconClass}`}>
        <Icon className="size-4 sm:size-5" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate font-title text-[clamp(0.8rem,3.6vw,1.25rem)] leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-[clamp(0.5rem,2vw,0.68rem)] text-muted-foreground">{label}</p>
        {delta}
      </div>
    </div>
  )
}

/**
 * Tarjeta de productividad del mes, con el mismo lenguaje visual que las
 * tarjetas de Inicio (contenedor grande, título tipo h2), pero en una sola
 * fila de 4 tarjetas horizontales (no apiladas verticalmente).
 */
export function ProductivityBand({ current, prev }: { current: Productivity; prev: Productivity }) {
  return (
    <section className="space-y-4 rounded-[1.75rem] bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Productividad este mes</h2>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        <Tile
          icon={Clock}
          iconClass="text-primary"
          label="Horas tatuadas"
          value={formatHM(current.tattooedMinutes)}
          delta={<DeltaTag cur={current.tattooedMinutes} prev={prev.tattooedMinutes} />}
        />

        <Tile
          icon={Activity}
          iconClass="text-primary"
          label="Sesiones realizadas"
          value={current.sessionsDone}
          delta={<DeltaTag cur={current.sessionsDone} prev={prev.sessionsDone} />}
        />

        <Tile
          icon={CheckCircle2}
          iconClass="text-[color:var(--success)]"
          label="Proyectos finalizados"
          value={current.projectsFinished}
          delta={<DeltaTag cur={current.projectsFinished} prev={prev.projectsFinished} />}
        />

        <Tile
          icon={Hourglass}
          iconClass="text-muted-foreground"
          label="Horas pendientes"
          value={formatHM(current.pendingMinutes)}
          delta={<DeltaTag cur={current.pendingMinutes} prev={prev.pendingMinutes} />}
        />
      </div>
    </section>
  )
}
