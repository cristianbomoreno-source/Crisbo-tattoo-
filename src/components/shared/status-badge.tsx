import { cn } from '@/lib/utils'

export type Tone = 'active' | 'process' | 'success' | 'warning' | 'destructive'

// Etiqueta + tono semántico por estado. Ver DESIGN.md §6.
// Exportado (además de <StatusBadge/>) para que otras superficies —p.ej. las
// tarjetas de cotización con foto de fondo— puedan construir su propio chip
// reutilizando el MISMO sistema de colores, sin duplicar el mapeo.
export const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = {
  // Proyectos
  quote: { label: 'Cotización', tone: 'process' },
  design: { label: 'Diseño', tone: 'process' },
  approval: { label: 'Aprobación', tone: 'process' },
  scheduled: { label: 'Agendado', tone: 'process' },
  in_progress: { label: 'En progreso', tone: 'active' },
  completed: { label: 'Completado', tone: 'success' },
  // Cotizaciones
  new: { label: 'Nueva', tone: 'process' },
  reviewed: { label: 'Revisada', tone: 'process' },
  quoted: { label: 'Cotizada', tone: 'process' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'destructive' },
  // Sesiones
  rescheduled: { label: 'Reprogramada', tone: 'warning' },
  cancelled: { label: 'Cancelada', tone: 'destructive' },
}

// El color va en el dot (el texto queda neutro de alto contraste → AA en ambos temas).
export const DOT: Record<Tone, string> = {
  active: 'bg-primary',
  process: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, tone: 'process' as Tone }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1',
        'font-display text-[11px] font-medium uppercase tracking-wider text-foreground',
        config.tone === 'active' && 'border-primary/30'
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT[config.tone])} />
      {config.label}
    </span>
  )
}
