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
import { ProjectPayments } from '@/components/payments/project-payments'
import { ProjectCoverPhoto } from '@/components/projects/project-cover-photo'
import { CaretLeft, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d'
import Link from 'next/link'
import {
  calculateBalance,
  getSessionStats,
  nextSessionAt,
  cop,
} from '@/lib/projects/metrics'
import { notFound } from 'next/navigation'

/** Cifra del proyecto como tarjeta de color al estilo Apple Games. */
function StatTile({ tone, icon, value, label }: { tone: string; icon: Icon3DName; value: string; label: string }) {
  return (
    <div className={`relative min-h-24 overflow-hidden rounded-[1.5rem] p-3.5 text-white ${tone}`}>
      <Icon3D name={icon} className="absolute top-2 right-2 size-10" />
      <p className="absolute right-3.5 bottom-3.5 left-3.5">
        <span className="block truncate font-title text-[1.25rem] leading-tight font-bold tabular-nums">{value}</span>
        <span className="block truncate text-[12px] font-semibold text-white/75">{label}</span>
      </p>
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
          className="grid size-12 place-items-center rounded-full bg-secondary text-foreground transition-transform duration-150 ease-out active:scale-[0.94]"
        >
          <CaretLeft className="size-6" weight="bold" />
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

      {/* ===== Encabezado: foto a lo ancho con el título encima (estilo Apple Games) ===== */}
      <ProjectCoverPhoto
        projectName={p.name}
        gallery={gallery.map((g) => ({ id: g.id, url: g.url, caption: g.caption }))}
        coverPhotoId={latestPhoto?.id ?? null}
      >
        <span
          className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[13px] font-semibold backdrop-blur-md"
          title={consentSigned ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
        >
          <ShieldCheck className={consentSigned ? 'size-4 text-primary' : 'size-4 text-white/60'} weight="fill" />
          {consentSigned ? 'Consentimiento firmado' : 'Sin consentimiento'}
        </span>
        <h1 className="truncate text-[2rem] leading-tight font-bold tracking-tight">{p.clients?.name ?? p.name}</h1>
        <p className="truncate text-[1.0625rem] text-white/75">{p.name}</p>
      </ProjectCoverPhoto>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="tile-indigo" icon="spiral-calendar" value={`${done} de ${total}`} label={total === 1 ? 'Sesión' : 'Sesiones'} />
        <StatTile tone="tile-green" icon="coin" value={cop(paid)} label={balance > 0 ? 'Abonado' : 'Pagado completo'} />
        <StatTile tone="tile-teal" icon="money-bag" value={cop(Math.max(0, balance))} label="Saldo pendiente" />
        <StatTile
          tone="tile-gold"
          icon="hourglass-not-done"
          value={p.worked_minutes > 0 ? `${Math.floor(p.worked_minutes / 60)}h ${String(p.worked_minutes % 60).padStart(2, '0')}m` : '—'}
          label="Tatuado"
        />
      </div>

      {/* ===== Progreso del proyecto (editable — ver ProjectProgressEditor) ===== */}
      <ProjectProgressEditor projectId={p.id} pct={pct} manualProgress={p.manual_progress} />

      {/* ===== Editor de sesiones/abono/valor (compacto) ===== */}
      <section className="grid grid-cols-2 gap-3 rounded-[2rem] bg-card p-4 sm:p-5">
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
      <ProjectPayments payments={p.payments} />

      {/* ===== Notas (si hay) ===== */}
      {p.notes && (
        <section className="rounded-[2rem] bg-card p-4 sm:p-5">
          <h2 className="font-title text-[1.25rem] font-bold tracking-tight">Notas</h2>
          <p className="mt-1 text-[1.0625rem] text-foreground/85">{p.notes}</p>
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
