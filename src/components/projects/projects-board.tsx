'use client'

import * as React from 'react'
import Link from 'next/link'

import { ProjectCard } from '@/components/projects/project-card'
import { ProjectDetailDialog } from '@/components/projects/project-detail-dialog'
import { ProjectsToolbar } from '@/components/projects/projects-toolbar'
import { ProductivityBand } from '@/components/projects/productivity-band'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { productivityMetrics } from '@/lib/projects/productivity'
import { getSessionStats, cop } from '@/lib/projects/metrics'
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
        <button
          type="button"
          onClick={() => setChip('all')}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-xs font-medium uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            chip === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setChip('completed')}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-xs font-medium uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            chip === 'completed'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          Completados
          <span className="size-1.5 rounded-full bg-[color:var(--success)]" aria-hidden="true" />
        </button>

        {/* Filtro por mes */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label="Filtrar proyectos por mes"
          className="cursor-pointer rounded-full border border-border bg-transparent px-3 py-1.5 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Proyectos por mes</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {capitalize(monthLabel(m))}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No hay proyectos"
          description={
            query ? `No hay resultados para «${query}».` : 'Crea tu primer proyecto de tatuaje.'
          }
        />
      ) : view === 'list' ? (
        <div className="space-y-2.5">
          {visible.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

/** Fila compacta para la vista Lista. */
function ProjectRow({ project }: { project: ProjectSummary }) {
  const { total, done } = getSessionStats(project)
  const pct = total > 0 ? Math.round((done / total) * 100) : project.status === 'completed' ? 100 : 0
  const value = project.total_value ?? 0
  const clientName = project.clients?.name ?? 'Sin cliente'
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="flex items-center gap-3 rounded-2xl border-l-2 border-l-primary bg-card p-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-medium uppercase leading-tight tracking-tight">
          {clientName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{project.name}</p>
      </div>
      <StatusBadge status={project.status} />
      <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{pct}%</span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{cop(value)}</span>
    </Link>
  )
}
