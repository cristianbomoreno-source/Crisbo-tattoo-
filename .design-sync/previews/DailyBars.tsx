import { DailyBars } from 'crisbo-tattoo'

const oct = [0, 300, 0, 800, 200, 0, 0, 1200, 400, 0, 0, 600, 900, 0, 300, 0, 0, 1500, 200, 0, 700, 0, 0, 400, 1100, 300, 0, 0, 0, 0, 0]

export const MesEnCurso = () => (
  <div className="w-56 rounded-[1.25rem] bg-card p-4">
    <p className="text-[12px] text-muted-foreground">Cotizado por día</p>
    <DailyBars values={oct} upToIndex={25} className="mt-2" />
  </div>
)

export const MesCompleto = () => (
  <div className="w-56 rounded-[1.25rem] bg-card p-4">
    <p className="text-[12px] text-muted-foreground">Sesiones por día · septiembre</p>
    <DailyBars values={[1, 0, 2, 1, 0, 1, 0, 2, 2, 1, 0, 0, 1, 1, 2, 0, 1, 1, 0, 2, 1, 0, 0, 1, 2, 1, 0, 1, 2, 1]} className="mt-2" />
  </div>
)
