import Link from 'next/link'
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { cop } from '@/lib/projects/metrics'
import { monthLabel, shiftMonth, capitalize } from '@/lib/calendar/utils'
import { ConfirmedIncomeDialog } from '@/components/stats/confirmed-income-dialog'
import { CumulativeChart, DeltaChip } from '@/components/stats/charts'
import type { MonthPayment } from '@/lib/stats/period-metrics'

/**
 * Cabecera de Estadísticas: selector de mes y la plata que entró, con la
 * curva acumulada del mes contra la del mes anterior. Tocar el monto abre
 * la lista de pagos (para corregir fechas o borrar).
 */
export function StatsHero({
  monthKey,
  income,
  prevIncome,
  prevSameDay,
  cumulative,
  prevCumulative,
  upToIndex,
  payments,
}: {
  monthKey: string
  income: number
  prevIncome: number
  /** Lo que llevaba el mes anterior a esta misma altura del mes (comparación justa). */
  prevSameDay: number
  cumulative: number[]
  prevCumulative: number[]
  upToIndex: number
  payments: MonthPayment[]
}) {
  const prevMonthKey = shiftMonth(monthKey, -1)
  const nextMonthKey = shiftMonth(monthKey, 1)
  const delta = prevSameDay > 0 ? Math.round(((income - prevSameDay) / prevSameDay) * 100) : null

  return (
    <section className="rounded-[1.5rem] bg-card p-4 sm:p-6">
      <div className="-mx-1.5 -mt-1.5 flex items-center justify-between">
        <Link
          href={`/dashboard/stats?m=${prevMonthKey}`}
          aria-label="Mes anterior"
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        >
          <CaretLeft className="size-5" weight="bold" />
        </Link>
        <h1 className="text-base font-semibold">{capitalize(monthLabel(monthKey))}</h1>
        <Link
          href={`/dashboard/stats?m=${nextMonthKey}`}
          aria-label="Mes siguiente"
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        >
          <CaretRight className="size-5" weight="bold" />
        </Link>
      </div>

      <ConfirmedIncomeDialog payments={payments} total={income} monthKey={monthKey}>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">Entró</p>
            <p className="font-title text-[clamp(2rem,9vw,2.75rem)] font-bold leading-none tracking-tight tabular-nums">{cop(income)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pb-1">
            <DeltaChip pct={delta} />
            <CaretRight className="size-4 text-muted-foreground" weight="bold" aria-hidden />
          </div>
        </div>
      </ConfirmedIncomeDialog>

      <div className="mt-4">
        <CumulativeChart
          current={cumulative}
          previous={prevCumulative}
          upToIndex={upToIndex}
          label={`Ingresos acumulados: ${cop(income)} este mes, ${cop(prevIncome)} el mes anterior`}
        />
      </div>
      <div className="mt-2 flex items-center gap-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 rounded-full bg-primary" aria-hidden /> Este mes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-3.5 border-t-[1.5px] border-dashed border-muted-foreground" aria-hidden /> Mes anterior · {cop(prevIncome)}
        </span>
      </div>
    </section>
  )
}
