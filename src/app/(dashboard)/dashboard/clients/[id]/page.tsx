import Link from 'next/link'
import { notFound } from 'next/navigation'
import { User, Phone, CalendarClock, FileSignature, Layers } from 'lucide-react'
// lucide-react 1.21 NO trae `Instagram` (verificado) — glyph inline, patrón de step-socials.tsx.

import { getClient } from '@/queries/clients'
import { getProjectsByClient } from '@/queries/projects'
import { getSignedConsentsByClient } from '@/queries/consents'
import { clientTotals, clientAppointments } from '@/lib/clients/dossier'
import { calculateBalance, getSessionStats, cop, formatSessionDate } from '@/lib/projects/metrics'
import { formatTime, nowAsWallClock } from '@/lib/calendar/utils'
import { waLink } from '@/lib/whatsapp'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DeleteClientButton } from '@/components/clients/delete-client-button'
import { Card, CardContent } from '@/components/ui/card'

/** Glyph de Instagram inline (lucide 1.21 no lo trae) — patrón de step-socials.tsx. */
function IgGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-background/40 p-3">
      <p className="font-display text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1.5 text-sm font-semibold tabular-nums ${accent ? 'text-primary' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function AppointmentRow({
  projectId,
  projectName,
  scheduledAt,
  durationMinutes,
  status,
}: {
  projectId: string
  projectName: string
  scheduledAt: string
  durationMinutes: number
  status: string
}) {
  return (
    <Link
      href={`/dashboard/projects/${projectId}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate font-display text-xs font-semibold uppercase tracking-wide">
          {projectName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {formatSessionDate(new Date(scheduledAt))} · {formatTime(scheduledAt)} · {durationMinutes} min
        </p>
      </div>
      <StatusBadge status={status} />
    </Link>
  )
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const clientResult = await getClient(id)
  if (!clientResult.success) notFound()
  const client = clientResult.data

  const [projectsResult, consentsResult] = await Promise.all([
    getProjectsByClient(id),
    getSignedConsentsByClient(id),
  ])
  const projects = projectsResult.success ? projectsResult.data : []
  const consents = consentsResult.success ? consentsResult.data : []

  const totals = clientTotals(projects)
  const { upcoming, past } = clientAppointments(projects, nowAsWallClock())

  const wa = waLink(client.phone, `Hola ${client.name}, te escribo de tu estudio de tatuaje.`)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="size-4" strokeWidth={1.8} aria-hidden="true" />
        Todos los clientes
      </Link>

      <PageHeader
        kicker="Cliente"
        title={client.name}
        action={<DeleteClientButton clientId={client.id} clientName={client.name} />}
      />

      {/* Contacto + CTA WhatsApp */}
      <div className="flex flex-wrap items-center gap-2">
        {client.phone && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm">
            <Phone className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
            <span className="tabular-nums">{client.phone}</span>
          </span>
        )}
        {client.instagram && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm">
            <IgGlyph className="size-3.5 text-muted-foreground" />
            {client.instagram}
          </span>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Phone className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
            Escribir por WhatsApp
          </a>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Proyectos" value={String(totals.projectCount)} />
        <Tile label="Total pagado" value={cop(totals.totalPaid)} />
        <Tile
          label="Saldo pendiente"
          value={totals.totalBalance > 0 ? cop(totals.totalBalance) : '$0 · Al día'}
          accent={totals.totalBalance > 0}
        />
      </div>

      {/* Proyectos */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider">
          <Layers className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Proyectos
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este cliente aún no tiene proyectos.</p>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => {
              const balance = calculateBalance(p)
              const { done, total } = getSessionStats(p)
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">
                        {p.name}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {done} de {total} {total === 1 ? 'sesión' : 'sesiones'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${balance > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {balance > 0 ? cop(balance) : '$0'}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Próximas citas */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider">
            <CalendarClock className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
            Próximas citas
          </h2>
          <div className="grid gap-2">
            {upcoming.map((a) => (
              <AppointmentRow
                key={a.id}
                projectId={a.projectId}
                projectName={a.projectName}
                scheduledAt={a.scheduledAt}
                durationMinutes={a.durationMinutes}
                status={a.status}
              />
            ))}
          </div>
        </section>
      )}

      {/* Historial de citas */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider">
          <CalendarClock className="size-4 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
          Historial de citas
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin citas pasadas.</p>
        ) : (
          <div className="grid gap-2">
            {past.map((a) => (
              <AppointmentRow
                key={a.id}
                projectId={a.projectId}
                projectName={a.projectName}
                scheduledAt={a.scheduledAt}
                durationMinutes={a.durationMinutes}
                status={a.status}
              />
            ))}
          </div>
        )}
      </section>

      {/* Consentimientos firmados */}
      {consents.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider">
            <FileSignature className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
            Consentimientos firmados
          </h2>
          <div className="grid gap-2">
            {consents.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/projects/${c.project_id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 transition-colors hover:border-primary/40"
              >
                <span className="truncate text-sm">{c.projects?.name ?? 'Proyecto'}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {c.signed_at ? formatSessionDate(new Date(c.signed_at)) : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Notas */}
      {client.notes && (
        <Card className="max-w-lg">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Notas</p>
            <p className="mt-1">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
