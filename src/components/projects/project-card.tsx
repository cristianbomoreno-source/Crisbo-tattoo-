import { STATUS_LABELS } from '@/lib/projects/status'
import type { ProjectSummary } from '@/queries/projects'
import { getSessionStats, latestPhotoUrl } from '@/lib/projects/metrics'
import { RemotePhoto } from '@/components/shared/remote-photo'
import { Icon3D } from '@/components/ui/icon-3d'
import { cn } from '@/lib/utils'

/** Avance del proyecto: el % manual del tatuador o, si no hay, el de sesiones. */
export function projectProgress(project: ProjectSummary) {
  const { total, done } = getSessionStats(project)
  const sessionPct = total > 0 ? Math.round((done / total) * 100) : project.status === 'completed' ? 100 : 0
  const pct = project.manual_progress ?? sessionPct
  const complete = project.status === 'completed' || pct >= 100
  const label = complete ? 'Completado' : project.status === 'in_progress' ? `${pct}% en proceso` : STATUS_LABELS[project.status]
  return { pct, complete, label, total, done }
}

/**
 * Card de proyecto al estilo de las tarjetas de Apple Games: la foto ocupa
 * toda la tarjeta y encima, sobre un degradado oscuro, van el cliente, el
 * proyecto, la barra de avance y el estado en una píldora de vidrio. Sin
 * foto, la tarjeta es de color (dorado en proceso, verde completado, gris el
 * resto) con un ícono 3D.
 * No navega: el click completo lo maneja el padre (onOpen), que abre el popup.
 */
export function ProjectCard({ project, onOpen }: { project: ProjectSummary; onOpen: (project: ProjectSummary) => void }) {
  const { pct, complete, label } = projectProgress(project)
  const clientName = project.clients?.name ?? 'Sin cliente'
  const cover = latestPhotoUrl(project.gallery)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(project)
        }
      }}
      className="group block cursor-pointer rounded-[1.75rem] transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <article
        className={cn(
          'relative aspect-[4/5] overflow-hidden rounded-[1.75rem] text-white',
          !cover && (complete ? 'tile-green' : project.status === 'in_progress' ? 'tile-gold' : 'tile-slate'),
        )}
      >
        {cover ? (
          <RemotePhoto src={cover} width={600} className="absolute inset-0 size-full object-cover" />
        ) : (
          <Icon3D name={complete ? 'trophy' : 'fountain-pen'} className="absolute top-4 left-1/2 size-20 -translate-x-1/2" />
        )}

        <span className="absolute top-2.5 left-2.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-md">
          {label}
        </span>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pt-10 pb-3">
          <p className="truncate text-[1.0625rem] leading-tight font-bold tracking-tight">{clientName}</p>
          <p className="truncate text-[13px] text-white/70">{project.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn('h-full rounded-full transition-[width] duration-500 ease-out', complete ? 'bg-income' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[12px] font-bold tabular-nums">{pct}%</span>
          </div>
        </div>
      </article>
    </div>
  )
}
