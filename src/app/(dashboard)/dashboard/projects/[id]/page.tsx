import { getProject } from '@/queries/projects'
import { getCurrentStudio } from '@/queries/studio'
import { getGallery } from '@/queries/gallery'
import { getConsentLinksByProject } from '@/queries/consent-links'
import { MedicalAlertBanner } from '@/components/projects/medical-alert-banner'
import { SessionDepositEditor } from '@/components/projects/session-deposit-editor'
import { ProjectValueEditor } from '@/components/projects/project-value-editor'
import { ProjectProgressEditor } from '@/components/projects/project-progress-editor'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { ContactClientWhatsapp } from '@/components/projects/contact-client-whatsapp'
import { MultiSessionDialog } from '@/components/sessions/multi-session-dialog'
import { parseDurationLabel } from '@/lib/quote-wizard/duration'
import { SessionsCard } from '@/components/sessions/sessions-card'
import { RegisterPaymentDialog } from '@/components/payments/register-payment-dialog'
import { GalleryCard } from '@/components/gallery/gallery-card'
import { ProjectCoverPhoto } from '@/components/projects/project-cover-photo'
import {
  ArrowLeft,
  CalendarDays,
  Wallet,
  CircleDollarSign,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import {
  calculateBalance,
  getSessionStats,
  nextSessionAt,
  cop,
} from '@/lib/projects/metrics'
import { notFound } from 'next/navigation'

/** Bloque de estadística: ícono en círculo lima + número + etiqueta — mismo
 * patrón que las tarjetas de Inicio (today-cards.tsx). */
function StatBlock({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div>
        <p className="text-base font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success) notFound()
  const p = result.data
  const studio = await getCurrentStudio()

  const galleryResult = await getGallery(id)
  const gallery = galleryResult.success ? galleryResult.data : []
  const latestPhoto = [...gallery].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  const linksResult = await getConsentLinksByProject(id)
  const consentSigned = linksResult.success && linksResult.data.some((l) => l.status === 'signed')
  const medicalAlert = linksResult.success && linksResult.data.some((l) => l.has_medical_alert)

  const balance = calculateBalance(p)
  const stats = getSessionStats(p)
  const { total, done } = stats
  const pct = p.manual_progress ?? stats.pct
  const next = nextSessionAt(p)
  const paid = (p.total_value ?? 0) - balance

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/projects"
          aria-label="Volver a proyectos"
          className="flex size-10 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="size-4.5" strokeWidth={2} />
        </Link>
        <div className="flex items-center gap-2">
          <ContactClientWhatsapp
            phone={p.clients?.phone}
            clientName={p.clients?.name ?? 'Cliente'}
            projectName={p.name}
            template={studio?.contactClientTemplate}
          />
          <DeleteProjectButton projectId={p.id} projectName={p.name} />
        </div>
      </div>

      {medicalAlert && <MedicalAlertBanner projectId={p.id} />}

      {/* ===== Encabezado: foto + info ===== */}
      <div className="space-y-3">
        <ProjectCoverPhoto
          projectName={p.name}
          gallery={gallery.map((g) => ({ id: g.id, url: g.url, caption: g.caption }))}
          coverPhotoId={latestPhoto?.id ?? null}
        />

        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate font-title text-2xl leading-tight sm:text-3xl">
              {p.clients?.name ?? p.name}
            </h1>
            <span
              className={
                consentSigned
                  ? 'grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary'
                  : 'grid size-8 shrink-0 place-items-center rounded-full bg-card text-muted-foreground'
              }
              title={consentSigned ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
              aria-label={consentSigned ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
            >
              <ShieldCheck className="size-4" strokeWidth={2} />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{p.name}</p>

          <div className={`grid gap-2 pt-1 ${p.worked_minutes > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <StatBlock icon={CalendarDays} value={String(total)} label={total === 1 ? 'Sesión' : 'Sesiones'} />
            <StatBlock icon={Wallet} value={balance > 0 ? 'Pendiente' : 'Pagado'} label={cop(paid)} />
            <StatBlock icon={CircleDollarSign} value={cop(balance)} label="Saldo" />
            {p.worked_minutes > 0 && (
              <StatBlock
                icon={Clock}
                value={`${Math.floor(p.worked_minutes / 60)}h ${String(p.worked_minutes % 60).padStart(2, '0')}m`}
                label="Tatuado"
              />
            )}
          </div>
        </div>
      </div>

      {/* ===== Progreso del proyecto (editable — ver ProjectProgressEditor) ===== */}
      <ProjectProgressEditor projectId={p.id} pct={pct} manualProgress={p.manual_progress} />

      {/* ===== Editor de sesiones/abono/valor (compacto) ===== */}
      <section className="grid grid-cols-2 gap-3 rounded-[1.75rem] bg-card p-4 sm:p-5">
        <ProjectValueEditor projectId={p.id} totalValue={p.total_value} />
        <SessionDepositEditor
          projectId={p.id}
          sessionCount={p.session_count}
          depositPercentage={p.deposit_percentage}
        />
      </section>

      {/* ===== Sesiones y Galería: tarjetas compactas, se abren en popup ===== */}
      <SessionsCard
        projectId={p.id}
        sessions={p.sessions}
        payments={p.payments}
        done={done}
        total={total}
        nextDate={next}
      />
      <GalleryCard projectId={p.id} gallery={gallery} projectName={p.name} />

      {/* ===== Notas (si hay) ===== */}
      {p.notes && (
        <section className="rounded-[1.75rem] bg-card p-4 sm:p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
          <p className="mt-1 text-sm">{p.notes}</p>
        </section>
      )}

      {/* ===== Acciones: agendar (protagonista) + registrar pago ===== */}
      <section className="grid grid-cols-2 gap-2.5">
        <MultiSessionDialog
          projectId={p.id}
          initialDurationMinutes={parseDurationLabel(p.quotes?.avg_session_duration) ?? undefined}
        />
        <RegisterPaymentDialog projectId={p.id} balance={balance} />
      </section>
    </div>
  )
}
