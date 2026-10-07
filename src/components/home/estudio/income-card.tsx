import Link from 'next/link'

function formatCOP(amount: number) {
  return `$${Math.round(amount).toLocaleString('es-CO')}`
}

/** Donut pequeño con conic-gradient (sin dependencias) — solo apoyo visual,
 * el dato real vive en la barra de progreso y las cifras de abajo. */
function MiniDonut({ pct }: { pct: number }) {
  return (
    <div
      className="relative grid size-16 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, color-mix(in srgb, var(--color-primary) 15%, transparent) 0deg)`,
      }}
    >
      <div className="grid size-12 place-items-center rounded-full bg-card">
        <span className="text-xs font-bold tabular-nums text-primary">{pct}%</span>
      </div>
    </div>
  )
}

export function IncomeCard({
  expected,
  deposits,
  pending,
}: {
  expected: number
  deposits: number
  pending: number
}) {
  const pct = expected > 0 ? Math.min(100, Math.round((deposits / expected) * 100)) : 0

  return (
    <section className="rounded-[1.75rem] bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-title text-base uppercase leading-none">Ingresos del día</h2>
        <Link href="/dashboard/settings/finanzas" className="text-xs font-medium text-primary">
          Ver detalle →
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Hoy</p>
          <p className="truncate text-2xl font-bold tabular-nums">{formatCOP(expected)}</p>
          <p className="text-xs text-muted-foreground">Ingresos proyectados</p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Ingresado <span className="font-semibold tabular-nums">{formatCOP(deposits)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              Pendiente <span className="font-semibold tabular-nums">{formatCOP(pending)}</span>
            </span>
          </div>
        </div>

        <MiniDonut pct={pct} />
      </div>
    </section>
  )
}
