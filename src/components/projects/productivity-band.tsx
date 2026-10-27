import { TrendDown, TrendUp } from '@phosphor-icons/react/dist/ssr'
import { deltaPct } from '@/lib/home/month-metrics'
import { formatHM, type Productivity } from '@/lib/projects/productivity'
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d'
import type { TileTone } from '@/components/ui/tile'
import { cn } from '@/lib/utils'

// Clases literales para que Tailwind las encuentre (ver @utility tile-* en globals.css).
const TONE: Partial<Record<TileTone, string>> = {
  gold: 'tile-gold',
  indigo: 'tile-indigo',
  green: 'tile-green',
  gray: 'tile-gray',
}

function Stat({
  tone,
  icon,
  label,
  value,
  cur,
  prev,
}: {
  tone: TileTone
  icon: Icon3DName
  label: string
  value: React.ReactNode
  cur: number
  prev: number
}) {
  const pct = deltaPct(cur, prev)
  return (
    <div className={cn('relative min-h-28 overflow-hidden rounded-[1.75rem] p-4 text-white', TONE[tone])}>
      <Icon3D name={icon} className="absolute top-2.5 right-2.5 size-12" />
      <div className="absolute bottom-4 left-4 right-4">
        {pct !== null && (
          <p className="flex items-center gap-1 text-[13px] font-semibold text-white/75 tabular-nums">
            {pct >= 0 ? <TrendUp className="size-3.5" weight="bold" /> : <TrendDown className="size-3.5" weight="bold" />}
            {pct > 0 ? '+' : ''}
            {pct}%
          </p>
        )}
        <p className="font-title text-[1.625rem] leading-none font-bold tabular-nums">{value}</p>
        <p className="mt-1 truncate text-[13px] font-semibold text-white/80">{label}</p>
      </div>
    </div>
  )
}

/**
 * Productividad del mes como tarjetas de color al estilo Apple Games (ícono
 * 3D arriba a la derecha, cifra grande abajo y la variación contra el mes
 * anterior). 2 columnas en el celular, 4 en la web.
 */
export function ProductivityBand({ current, prev }: { current: Productivity; prev: Productivity }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        tone="gold"
        icon="fountain-pen"
        label="Horas tatuadas"
        value={formatHM(current.tattooedMinutes)}
        cur={current.tattooedMinutes}
        prev={prev.tattooedMinutes}
      />
      <Stat
        tone="indigo"
        icon="spiral-calendar"
        label="Sesiones"
        value={current.sessionsDone}
        cur={current.sessionsDone}
        prev={prev.sessionsDone}
      />
      <Stat
        tone="green"
        icon="trophy"
        label="Finalizados"
        value={current.projectsFinished}
        cur={current.projectsFinished}
        prev={prev.projectsFinished}
      />
      <Stat
        tone="gray"
        icon="hourglass-not-done"
        label="Horas pendientes"
        value={formatHM(current.pendingMinutes)}
        cur={current.pendingMinutes}
        prev={prev.pendingMinutes}
      />
    </section>
  )
}
