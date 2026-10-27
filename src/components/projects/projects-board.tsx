'use client'

import * as React from 'react'
import Link from 'next/link'

import { ProjectCard, projectProgress } from '@/components/projects/project-card'
import { ProjectDetailDialog } from '@/components/projects/project-detail-dialog'
import { ProjectsToolbar } from '@/components/projects/projects-toolbar'
import { ProductivityBand } from '@/components/projects/productivity-band'
import { SectionTitle } from '@/components/shared/large-title'
import { RemotePhoto } from '@/components/shared/remote-photo'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { productivityMetrics } from '@/lib/projects/productivity'
import { cop, latestPhotoUrl } from '@/lib/projects/metrics'
import { todayKey, shiftMonth, monthLabel } from '@/lib/calendar/utils'
import type { ProjectSummary } from '@/queries/projects'

type ChipKey = 'all' | 'completed'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function ProjectsBoard({
  projects,
  q,
  view,
  contactClientTemplate,
}: {
  projects: ProjectSummary[]
  q?: string
  view: 'grid' | 'list'
  contactClientTemplate?: string | null
}) {
  const [chip, setChip] = React.useState<ChipKey>('all')
  const [monthFilter, setMonthFilter] = React.useState<string>('all')
  const [selected, setSelected] = React.useState<ProjectSummary | null>(null)

  const monthKey = todayKey().slice(0, 7)
  const prevKey = shiftMonth(monthKey, -1)
  const current = productivityMetrics(monthKey, projects)
  const prev = productivityMetrics(prevKey, projects)

  // Meses con al menos un proyecto creado, más reciente primero.
  const months = React.useMemo(() => {
    const set = new Set(projects.map((p) => p.created_at.slice(0, 7)))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [projects])

  const query = q?.trim()
  let visible = projects
  if (query) {
    const needle = norm(query)
    visible = visible.filter(
      (p) => norm(p.name).includes(needle) || norm(p.clients?.name ?? '').includes(needle),
    )
  }
  if (chip === 'completed') {
    visible = visible.filter((p) => p.status === 'completed')
  }
  if (monthFilter !== 'all') {
    visible = visible.filter((p) => p.created_at.slice(0, 7) === monthFilter)
  }

  return (
    <div className="space-y-5">
      <ProductivityBand current={current} prev={prev} />

      <ProjectsToolbar />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['all', 'Todos'],
            ['completed', 'Completados'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setChip(key)}
            className={cn(
              'h-10 rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              chip === key ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08] text-foreground',
            )}
          >
            {label}
          </button>
        ))}

        {/* Filtro por mes */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label="Filtrar proyectos por mes"
          className={cn(
            'h-10 cursor-pointer appearance-none rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            monthFilter !== 'all' ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08] text-foreground',
          )}
        >
          <option value="all">Por mes</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {capitalize(monthLabel(m))}
            </option>
          ))}
        </select>
      </div>

      <SectionTitle title="Tus proyectos" subtitle={`${visible.length} en total`} />

      {visible.length === 0 ? (
        <EmptyState
          title="No hay proyectos"
          description={
            query ? `No hay resultados para «${query}».` : 'Crea tu primer proyecto de tatuaje.'
          }
        />
      ) : view === 'list' ? (
        <div className="space-y-4">
          {visible.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={setSelected} />
          ))}
        </div>
      )}

      <ProjectDetailDialog
        project={selected}
        onClose={() => setSelected(null)}
        contactClientTemplate={contactClientTemplate}
      />
    </div>
  )
}

/** Fila de la vista Lista, como "Tus juegos" de Apple Games: foto (o cuadro
 * de color) grande y redondeada, cliente en negrita, proyecto y estado en
 * gris, y el valor en una píldora gris a la derecha. */
function ProjectRow({ project }: { project: ProjectSummary }) {
  const { complete, label } = projectProgress(project)
  const value = project.total_value ?? 0
  const clientName = project.clients?.name ?? 'Sin cliente'
  const cover = latestPhotoUrl(project.gallery)
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="flex items-center gap-3.5 rounded-2xl transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        className={cn(
          'relative grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-[1.25rem] text-[1.5rem] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
          !cover && (complete ? 'tile-green' : project.status === 'in_progress' ? 'tile-gold' : 'tile-slate'),
        )}
      >
        {cover ? <RemotePhoto src={cover} width={200} className="absolute inset-0 size-full object-cover" /> : clientName.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.1875rem] leading-tight font-semibold">{clientName}</span>
        <span className="block truncate text-[15px] text-muted-foreground">
          {project.name} · <span className={cn(complete && 'text-income')}>{label}</span>
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold tabular-nums">{cop(value)}</span>
    </Link>
  )
}
