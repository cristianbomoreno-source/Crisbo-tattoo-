import type { ProjectStatus } from '@/queries/projects'

/** Etiqueta en español por estado de proyecto. */
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  quote: 'Cotización',
  design: 'Diseño',
  approval: 'Aprobación',
  scheduled: 'Agendado',
  in_progress: 'En progreso',
  completed: 'Completado',
}

/** Orden del pipeline (columnas) y de los chips de filtro. */
export const STATUS_ORDER: ProjectStatus[] = [
  'quote',
  'design',
  'approval',
  'scheduled',
  'in_progress',
  'completed',
]

/** Clase de color del dot por estado, alineada con StatusBadge (DESIGN.md §6). */
export const STATUS_DOT: Record<ProjectStatus, string> = {
  quote: 'bg-info',
  design: 'bg-info',
  approval: 'bg-info',
  scheduled: 'bg-info',
  in_progress: 'bg-primary',
  completed: 'bg-success',
}
