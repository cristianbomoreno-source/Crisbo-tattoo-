export function OccupancyRing({
  pct,
  label,
  sublabel,
  compact = false,
}: {
  pct: number
  label?: string
  sublabel?: string
  /** Versión chica para caber en una fila apretada (5 columnas en móvil). */
  compact?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  const r = 42
  const c = 2 * Math.PI * r
  const dash = (clamped / 100) * c
  const stroke = compact ? 10 : 8
  return (
    <div className={compact ? 'relative flex size-[clamp(3rem,16vw,5rem)] items-center justify-center' : 'relative flex size-28 items-center justify-center'}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`Ocupación ${clamped}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="var(--chart-1)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(2)} ${c.toFixed(2)}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className={compact ? 'font-title text-[clamp(0.6rem,4vw,1.25rem)] tabular-nums' : 'font-title text-2xl tabular-nums'}>{clamped}%</span>
        {!compact && label && <span className="mt-1 font-display text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>}
        {!compact && sublabel && <span className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  )
}
