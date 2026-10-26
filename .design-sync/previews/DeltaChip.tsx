import { DeltaChip } from 'crisbo-tattoo'

export const Estados = () => (
  <div className="flex items-center gap-2">
    <DeltaChip pct={27} />
    <DeltaChip pct={-14} />
    <DeltaChip pct={0} />
  </div>
)

export const JuntoAlNumero = () => (
  <div className="flex items-baseline gap-1.5">
    <span className="font-title text-[1.4rem] font-bold tabular-nums">$8,4M</span>
    <DeltaChip pct={18} />
  </div>
)
