import { Ring } from 'crisbo-tattoo'

export const Avance = () => (
  <div className="flex items-center gap-6">
    <Ring pct={34} size={64} label="34%">
      <span className="text-[13px] font-bold tabular-nums">34%</span>
    </Ring>
    <Ring pct={72} size={76} thickness={10} label="72%">
      <span className="text-[15px] font-bold tabular-nums">72%</span>
    </Ring>
    <Ring pct={100} size={76} thickness={10} color="var(--income)" label="Meta cumplida">
      <span className="text-[15px] font-bold tabular-nums">117%</span>
    </Ring>
  </div>
)
