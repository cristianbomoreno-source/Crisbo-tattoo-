'use client'

import Link from 'next/link'
import { Image as ImageIcon, CalendarDays, Wallet, ArrowUpRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { STATUS_LABELS } from '@/lib/projects/status'
import { ContactClientWhatsapp } from '@/components/projects/contact-client-whatsapp'
import type { ProjectSummary } from '@/queries/projects'
import {
  calculateBalance,
  getSessionStats,
  nextSessionAt,
  formatSessionDate,
  cop,
  latestPhotoUrl,
} from '@/lib/projects/metrics'

/**
 * Popup de detalle rápido de un proyecto: se abre al tocar cualquier parte
 * de la tarjeta (project-card.tsx ya no navega). Muestra lo esencial —foto,
 * estado, progreso, próxima sesión y saldo— con un enlace para abrir la
 * ficha completa si se necesita más detalle.
 */
export function ProjectDetailDialog({
  project,
  onClose,
  contactClientTemplate,
}: {
  project: ProjectSummary | null
  onClose: () => void
  contactClientTemplate?: string | null
}) {
  const open = project !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {project && <Content project={project} contactClientTemplate={contactClientTemplate} />}
    </Dialog>
  )
}

function Content({
  project,
  contactClientTemplate,
}: {
  project: ProjectSummary
  contactClientTemplate?: string | null
}) {
  const { total, done } = getSessionStats(project)
  const sessionPct = total > 0 ? Math.round((done / total) * 100) : project.status === 'completed' ? 100 : 0
  const pct = project.manual_progress ?? sessionPct
  const complete = project.status === 'completed' || pct >= 100
  const clientName = project.clients?.name ?? 'Sin cliente'
  const cover = latestPhotoUrl(project.gallery)
  const next = nextSessionAt(project)
  const balance = Math.max(0, calculateBalance(project))
  const statusText = complete
    ? 'Completado'
    : project.status === 'in_progress'
      ? `${pct}% en proceso`
      : STATUS_LABELS[project.status]

  return (
    <DialogContent className="max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md">
      <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={cover} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center">
            <ImageIcon className="size-8 text-muted-foreground/30" strokeWidth={1.4} />
          </span>
        )}
        <div
          className={`absolute left-3 top-3 rounded-full px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider ${
            complete ? 'bg-[#B8F400] text-black' : 'bg-black/85 text-white'
          }`}
        >
          {statusText}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-tight">
            {clientName}
          </DialogTitle>
          <DialogDescription>{project.name}</DialogDescription>
        </DialogHeader>

        <div>
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Progreso</span>
            <span className="font-bold tabular-nums text-foreground">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {total > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Sesión {done} de {total}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" strokeWidth={1.8} />
              Próxima sesión
            </span>
            <p className="mt-1 font-display text-sm font-semibold">
              {next ? formatSessionDate(next) : 'Sin agendar'}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" strokeWidth={1.8} />
              Saldo pendiente
            </span>
            <p className="mt-1 font-display text-sm font-semibold tabular-nums">{cop(balance)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
          >
            Ver proyecto completo
            <ArrowUpRight className="size-4" strokeWidth={2.2} />
          </Link>
          <ContactClientWhatsapp
            phone={project.clients?.phone}
            clientName={clientName}
            projectName={project.name}
            template={contactClientTemplate}
          />
        </div>
      </div>
      </div>
    </DialogContent>
  )
}
