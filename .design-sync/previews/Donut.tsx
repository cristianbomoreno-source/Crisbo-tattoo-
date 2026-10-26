import { Donut, CHART_COLORS } from 'crisbo-tattoo'

const estilos = [
  { label: 'Fine line', value: 12 },
  { label: 'Realismo', value: 9 },
  { label: 'Blackwork', value: 6 },
  { label: 'Lettering', value: 4 },
  { label: 'Tradicional', value: 3 },
].map((s, i) => ({ ...s, color: CHART_COLORS[i] }))

export const Estilos = () => (
  <div className="flex items-center gap-4">
    <Donut segments={estilos} size={112} thickness={14} label="Estilos más pedidos">
      <span className="font-title text-xl font-bold tabular-nums">34</span>
    </Donut>
    <ul className="space-y-1 text-[13px]">
      {estilos.map((s) => (
        <li key={s.label} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  </div>
)

export const DosPartes = () => (
  <Donut
    segments={[
      { label: 'Mujeres', value: 22, color: 'var(--primary)' },
      { label: 'Hombres', value: 14, color: 'var(--chart-3)' },
    ]}
    size={104}
    thickness={14}
    label="61% mujeres"
  >
    <span>
      <span className="block font-title text-xl font-bold tabular-nums">27</span>
      <span className="text-[11px] text-muted-foreground">años</span>
    </span>
  </Donut>
)
