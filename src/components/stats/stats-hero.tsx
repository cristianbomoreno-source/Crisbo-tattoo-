import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { monthLabel, shiftMonth, capitalize } from '@/lib/calendar/utils'

/** Frase de estado según el delta de cotizaciones vs. el mes anterior — nunca
 * inventa el número, solo elige el tono ("muy bien" / "bien" / "puede mejorar")
 * según el signo real del delta. Si no hay dato comparable (mes anterior en 0),
 * usa una frase neutral sin porcentaje. */
function heroCopy(deltaQuotesPct: number | null): { highlight: string; body: string } {
  if (deltaQuotesPct === null) {
    return { highlight: 'en marcha', body: 'Aún no hay datos suficientes del mes anterior para comparar.' }
  }
  if (deltaQuotesPct > 0) {
    return {
      highlight: 'muy bien',
      body: `Llevas un ${deltaQuotesPct}% más de cotizaciones que el mes anterior.`,
    }
  }
  if (deltaQuotesPct === 0) {
    return { highlight: 'estable', body: 'Llevas las mismas cotizaciones que el mes anterior.' }
  }
  return {
    highlight: 'en pausa',
    body: `Llevas un ${Math.abs(deltaQuotesPct)}% menos de cotizaciones que el mes anterior.`,
  }
}

export function StatsHero({
  monthKey,
  photoUrl,
  studioName,
  deltaQuotesPct,
  accentColor,
  monthlyGoal,
  quotedValue,
}: {
  monthKey: string
  photoUrl: string | null
  studioName: string
  deltaQuotesPct: number | null
  accentColor: string
  monthlyGoal: number | null
  quotedValue: number
}) {
  const prevMonthKey = shiftMonth(monthKey, -1)
  const nextMonthKey = shiftMonth(monthKey, 1)
  const { highlight, body } = heroCopy(deltaQuotesPct)
  const goalPct = monthlyGoal && monthlyGoal > 0 ? Math.min(100, Math.round((quotedValue / monthlyGoal) * 100)) : null

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] bg-card">
      <div className="relative h-[46vh] max-h-96 min-h-64 w-full overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={studioName} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/dashboard/stats?m=${prevMonthKey}`}
              className="font-display text-xs font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
              style={{ color: accentColor }}
            >
              {capitalize(monthLabel(monthKey))}
            </Link>
            <ChevronDown className="size-3.5" style={{ color: accentColor }} aria-hidden />
            <Link
              href={`/dashboard/stats?m=${nextMonthKey}`}
              className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              siguiente
            </Link>
          </div>

          <div>
            <h1 className="font-title text-[clamp(1.9rem,7vw,3rem)] uppercase leading-[0.98] text-white">
              Tu estudio va{' '}
              <span style={{ color: accentColor }}>{highlight}</span>.
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">{body}</p>
          </div>
        </div>
      </div>

      {goalPct !== null && monthlyGoal !== null && (
        <div className="p-4 pt-3.5 sm:p-6 sm:pt-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Meta mensual
            </p>
            <p className="font-title text-sm tabular-nums text-white">{cop(monthlyGoal)}</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${goalPct}%`, backgroundColor: accentColor }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs tabular-nums" style={{ color: accentColor }}>
            {goalPct}% <span className="text-muted-foreground">del objetivo</span>
          </p>
        </div>
      )}
    </section>
  )
}
