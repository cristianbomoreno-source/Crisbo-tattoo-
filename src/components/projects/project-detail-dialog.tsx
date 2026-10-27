'use client'

import Link from 'next/link'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { projectProgress } from '@/components/projects/project-card'
import { Icon3D } from '@/components/ui/icon-3d'
import { cn } from '@/lib/utils'
import { ContactClientWhatsapp } from '@/components/projects/contact-client-whatsapp'
import type { ProjectSummary } from '@/queries/projects'
import { calculateBalance, nextSessionAt, formatSessionDate, cop, latestPhotoUrl } from '@/lib/projects/metrics'

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

function Content({ project, contactClientTemplate }: { project: ProjectSummary; contactClientTemplate?: string | null }) {
  const { pct, complete, label, total, done } = projectProgress(project)
  const clientName = project.clients?.name ?? 'Sin cliente'
  const cover = latestPhotoUrl(project.gallery)
  const next = nextSessionAt(project)
  const balance = Math.max(0, calculateBalance(project))

  // Popup al estilo de las fichas de Apple Games: la foto arriba con el
  // título encima sobre un degradado, el avance como barra, dos tarjetas de
  // color (próxima sesión y saldo) y las acciones como píldoras.
  return (
    <DialogContent className="max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md">
      <div
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden text-white',
          !cover && (complete ? 'tile-green' : project.status === 'in_progress' ? 'tile-gold' : 'tile-slate'),
        )}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={cover} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Icon3D name={complete ? 'trophy' : 'fountain-pen'} className="absolute top-6 left-1/2 size-24 -translate-x-1/2" />
        )}
        <span className="absolute top-3.5 left-3.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-md">
          {label}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pt-14 pb-4">
          <DialogTitle className="truncate text-[1.75rem] leading-tight font-bold tracking-tight text-white">{clientName}</DialogTitle>
          <DialogDescription className="truncate text-[1.0625rem] text-white/75">{project.name}</DialogDescription>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Avance</span>
            <span className="font-title text-[1.25rem] font-bold tabular-nums">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500 ease-out', complete ? 'bg-income' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
          {total > 0 && (
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Sesión {done} de {total}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="tile-indigo relative min-h-24 overflow-hidden rounded-[1.5rem] p-3.5 text-white">
            <Icon3D name="spiral-calendar" className="absolute top-2 right-2 size-10" />
            <p className="absolute right-3.5 bottom-3.5 left-3.5">
              <span className="block text-[12px] font-semibold text-white/75">Próxima sesión</span>
              <span className="block truncate text-[1.0625rem] leading-tight font-bold">{next ? formatSessionDate(next) : 'Sin agendar'}</span>
            </p>
          </div>
          <div className="tile-teal relative min-h-24 overflow-hidden rounded-[1.5rem] p-3.5 text-white">
            <Icon3D name="money-bag" className="absolute top-2 right-2 size-10" />
            <p className="absolute right-3.5 bottom-3.5 left-3.5">
              <span className="block text-[12px] font-semibold text-white/75">Saldo pendiente</span>
              <span className="block truncate font-title text-[1.25rem] leading-tight font-bold tabular-nums">{cop(balance)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-[1.0625rem] font-semibold text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Ver proyecto
          </Link>
          <ContactClientWhatsapp
            phone={project.clients?.phone}
            clientName={clientName}
            projectName={project.name}
            template={contactClientTemplate}
          />
        </div>
      </div>
    </DialogContent>
  )
}
