import type { FinanceHealth as FinanceHealthT } from '@/lib/finance/metrics'

const TONE_BORDER: Record<FinanceHealthT['tone'], string> = {
  good: 'border-primary/30',
  warn: 'border-amber-400/25',
  bad: 'border-red-400/25',
}

/** Lectura automática del estado financiero del mes — pensada para
 * responderse en un vistazo, no como una tabla de indicadores. */
export function FinanceHealthCard({ health }: { health: FinanceHealthT }) {
  return (
    <div className={`rounded-[28px] border bg-card p-5 ${TONE_BORDER[health.tone]}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none">{health.emoji}</span>
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">{health.label}</p>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{health.message}</p>
    </div>
  )
}
