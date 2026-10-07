import { Image as ImageIcon } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/projects/status'
import type { ProjectSummary } from '@/queries/projects'
import { getSessionStats, latestPhotoUrl } from '@/lib/projects/metrics'
import { RemotePhoto } from '@/components/shared/remote-photo'

// Textura diagonal sutil para el placeholder de foto. Ver DESIGN.md §6.
const photoTexture: React.CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(135deg, var(--muted) 0 11px, var(--card) 11px 22px)',
}

/**
 * Card de proyecto — la fotografía domina la tarjeta; el bloque inferior es
 * lo más delgado posible (solo nombre, estilo, progreso y un chip de estado
 * a todo lo ancho). "Agendado" ya viene de STATUS_LABELS; "En progreso"
 * muestra en su lugar el porcentaje que puso el tatuador
 * (`manual_progress`) o, si no hay uno manual, el de sesiones completadas.
 * No navega: el click completo lo maneja el padre (onOpen), que abre el popup.
 */
export function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectSummary
  onOpen: (project: ProjectSummary) => void
}) {
  const { total, done } = getSessionStats(project)
  const sessionPct = total > 0 ? Math.round((done / total) * 100) : project.status === 'completed' ? 100 : 0
  const pct = project.manual_progress ?? sessionPct
  const complete = project.status === 'completed' || pct >= 100
  const clientName = project.clients?.name ?? 'Sin cliente'
  const cover = latestPhotoUrl(project.gallery)

  const chipText = complete
    ? 'Completado'
    : project.status === 'in_progress'
      ? `${pct}% en proceso`
      : STATUS_LABELS[project.status]

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
      className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article
        className="relative flex aspect-square flex-col overflow-hidden rounded-2xl bg-[#FAFAF8]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.35), 0 16px 34px -18px rgba(0,0,0,0.8)',
        }}
      >
        {/* ── Fotografía: domina la tarjeta ── */}
        <div className="relative min-h-0 flex-1 overflow-hidden" style={cover ? undefined : photoTexture}>
          {cover ? (
            <RemotePhoto src={cover} width={600} className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center">
              <ImageIcon
                className="size-[clamp(1.5rem,6vw,2.25rem)] text-muted-foreground/25"
                strokeWidth={1.4}
              />
            </span>
          )}
        </div>

        {/* ── Bloque inferior: al mínimo, solo lo esencial ── */}
        <div className="shrink-0 px-[clamp(0.55rem,2.6vw,0.85rem)] pb-[clamp(0.45rem,2vw,0.65rem)] pt-[clamp(0.35rem,1.6vw,0.5rem)]">
          <p className="truncate font-display text-[clamp(0.85rem,3.8vw,1.2rem)] font-bold uppercase leading-tight tracking-tight text-black">
            {clientName}
          </p>
          <p className="truncate text-[clamp(0.62rem,2.5vw,0.78rem)] leading-tight text-black/45">
            {project.name}
          </p>

          {/* Progreso: barra + porcentaje */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.08]">
              <div
                className="h-full rounded-full bg-[#B8F400] transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[clamp(0.56rem,2.3vw,0.7rem)] font-bold tabular-nums text-black">
              {pct}%
            </span>
          </div>

          {/* Chip de estado a todo lo ancho: verde cuando está completado */}
          <div
            className={`mt-1.5 flex items-center justify-center rounded-full py-1 font-display text-[clamp(0.5rem,2.1vw,0.64rem)] font-bold uppercase tracking-wider ${
              complete ? 'bg-[#B8F400] text-black' : 'bg-black/85 text-white'
            }`}
          >
            {chipText}
          </div>
        </div>
      </article>
    </div>
  )
}
