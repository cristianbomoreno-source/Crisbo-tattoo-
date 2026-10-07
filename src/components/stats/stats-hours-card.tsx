import { Flame } from 'lucide-react'

export function StatsHoursCard({ hours, avgPerSession }: { hours: number; avgPerSession: number }) {
  return (
    <div className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Horas tatuadas
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="font-title text-2xl tabular-nums text-primary">
          {hours % 1 === 0 ? hours : hours.toFixed(1)} h
        </p>
        <Flame className="size-4 text-primary/70" aria-hidden />
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Horas este mes</p>
      <div className="mt-4 border-t border-white/8 pt-3">
        <p className="font-title text-lg tabular-nums text-white">{avgPerSession.toFixed(1)} h</p>
        <p className="text-xs text-muted-foreground">Promedio por sesión</p>
      </div>
    </div>
  )
}
