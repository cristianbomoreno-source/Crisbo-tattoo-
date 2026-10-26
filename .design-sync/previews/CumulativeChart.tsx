import { CumulativeChart } from 'crisbo-tattoo'

const acc = (arr: number[]) => {
  let a = 0
  return arr.map((v) => (a += v))
}
const oct = acc([0, 150, 0, 420, 0, 0, 375, 0, 460, 0, 200, 0, 0, 300, 0, 0, 150, 0, 0, 520, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0].map((v) => v * 1000))
const sep = acc([100, 0, 200, 0, 0, 350, 0, 0, 0, 300, 0, 0, 250, 0, 0, 0, 400, 0, 0, 0, 200, 0, 0, 0, 300, 0, 0, 0, 150, 0].map((v) => v * 1000))

export const EsteMesVsAnterior = () => (
  <div className="max-w-md rounded-[1.5rem] bg-card p-4">
    <p className="text-[13px] text-muted-foreground">Entró</p>
    <p className="font-title text-4xl font-bold tabular-nums">$2.675.000</p>
    <div className="mt-4">
      <CumulativeChart current={oct} previous={sep} upToIndex={25} label="Ingresos acumulados de octubre contra septiembre" />
    </div>
  </div>
)
