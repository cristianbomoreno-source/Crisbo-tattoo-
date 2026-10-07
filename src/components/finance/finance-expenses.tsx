import { cop } from '@/lib/projects/metrics'

/** Comparación simple ingresos/gastos/utilidad del mes — solo verde OFINK
 * y grises, sin colores agresivos, como pidió el spec original. */
export function FinanceIncomeVsExpensesCard({
  income,
  expenses,
}: {
  income: number
  expenses: number
}) {
  const profit = income - expenses
  const max = Math.max(income, expenses, 1)

  const rows = [
    { label: 'Ingresos', value: income, className: 'bg-primary' },
    { label: 'Gastos', value: expenses, className: 'bg-white/25' },
  ]

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ingresos vs. gastos
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-white">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">{cop(r.value)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${r.className}`} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
        <span className="text-sm text-muted-foreground">Utilidad</span>
        <span className={`font-display text-sm font-semibold tabular-nums ${profit >= 0 ? 'text-primary' : 'text-red-400'}`}>
          {cop(profit)}
        </span>
      </div>
    </div>
  )
}

type CategoryTotal = { category: string; amount: number }

const DONUT_SHADES = ['var(--primary)', '#8fbf00', '#6b9900', '#4d7300', '#3a5900', '#2b4200']

/** Gastos agrupados por categoría (texto libre) — dona limpia hecha con
 * conic-gradient, sin librería de gráficas nueva. */
export function FinanceExpensesDonut({ totals }: { totals: CategoryTotal[] }) {
  if (totals.length === 0) return null
  const sum = totals.reduce((s, t) => s + t.amount, 0)
  if (sum <= 0) return null

  let acc = 0
  const stops = totals.map((t, i) => {
    const start = (acc / sum) * 100
    acc += t.amount
    const end = (acc / sum) * 100
    return `${DONUT_SHADES[i % DONUT_SHADES.length]} ${start}% ${end}%`
  })

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Gastos del estudio
      </h3>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="grid size-28 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${stops.join(', ')})` }}
        >
          <div className="grid size-[4.2rem] place-items-center rounded-full bg-card text-center">
            <span className="font-title text-base leading-none tabular-nums">{cop(sum)}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {totals.map((t, i) => (
            <div key={t.category} className="flex items-center gap-2 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ background: DONUT_SHADES[i % DONUT_SHADES.length] }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-white/80">{t.category}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{cop(t.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
