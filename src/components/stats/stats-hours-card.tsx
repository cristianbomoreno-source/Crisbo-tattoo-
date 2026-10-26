import { Columns } from '@/components/stats/charts'

const fmtHours = (h: number) => h.toLocaleString('es-CO', { maximumFractionDigits: 1 })

/** Horas tatuadas del mes repartidas por día de la semana: muestra qué días se llenan. */
export function StatsHoursCard({
  hours,
  avgPerSession,
  byWeekday,
}: {
  hours: number
  avgPerSession: number
  byWeekday: { label: string; value: number }[]
}) {
  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Horas tatuadas</h2>
        <p className="text-[12px] tabular-nums text-muted-foreground">{fmtHours(Math.round(avgPerSession * 10) / 10)} h por sesión</p>
      </div>
      <p className="mt-1 font-title text-[1.75rem] font-bold leading-none tabular-nums">
        {fmtHours(Math.round(hours * 10) / 10)}
        <span className="ml-0.5 text-base text-muted-foreground">h</span>
      </p>
      <div className="mt-4">
        <Columns items={byWeekday} height={72} format={(n) => fmtHours(Math.round(n * 10) / 10)} />
      </div>
    </section>
  )
}
