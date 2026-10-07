import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FeedbackBanner } from '@/components/feedback/feedback-banner'
import { InvitationBanner } from '@/components/settings/invitation-banner'
import { listMyPendingInvitations } from '@/actions/collaborators'
import { getCurrentStudio } from '@/queries/studio'
import { getBlockedDays } from '@/queries/blocked-days'
import {
  StudioControlCenter,
  computeStudioStatus,
} from '@/components/settings/studio-control-center'
import { StudioBrand } from '@/components/shared/studio-brand'
import { listJoinRequests, listTeam } from '@/actions/team'
import { getDisabledFeatures } from '@/queries/features'
import { getSettingsMetrics } from '@/queries/settings-metrics'

/**
 * Ajustes = Centro de control del estudio (ver studio-control-center.tsx):
 * héroe con identidad + anillo de progreso, y módulos-tarjeta con estado
 * real. Cada fila de estado y cada flecha de módulo son Links directos a
 * las subpáginas de siempre — sin previsualización embebida.
 */
export default async function SettingsPage() {
  const studio = await getCurrentStudio()
  const invitationsResult = await listMyPendingInvitations()
  const myInvitations = invitationsResult.success ? invitationsResult.data : []

  if (!studio) {
    return (
      <div>
        <PageHeader kicker="Estudio" title="Ajustes" />
        <InvitationBanner invitations={myInvitations} />
        <p className="text-sm text-muted-foreground">No se pudo cargar el estudio.</p>
      </div>
    )
  }

  if (studio.role !== 'owner') {
    return (
      <div>
        <PageHeader kicker={studio.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'} title="Ajustes del estudio" />
        <div className="mx-auto max-w-lg space-y-4">
          <InvitationBanner invitations={myInvitations} />
          <FeedbackBanner />
          <div className="flex items-center gap-4 rounded-2xl bg-card p-4">
            <StudioBrand name={studio.name} logoUrl={studio.logoUrl} />
          </div>
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Solo el dueño del estudio puede editar los ajustes.
          </p>
          <Link
            href="/dashboard/settings/cuentas"
            className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-medium transition-colors hover:bg-accent/60"
          >
            Cuentas OFINK
            <ArrowRight className="size-4 text-muted-foreground" strokeWidth={2} />
          </Link>
        </div>
      </div>
    )
  }

  // Fechas especiales de los próximos 12 meses: alimenta el chip del módulo Estudio.
  const now = new Date()
  const inAYear = new Date(now)
  inAYear.setFullYear(inAYear.getFullYear() + 1)
  const blockedResult = await getBlockedDays(now.toISOString(), inAYear.toISOString())
  const blockedDays = blockedResult.success ? blockedResult.data : []

  const status = computeStudioStatus(studio, blockedDays.length)

  const [requestsResult, teamResult, disabledFeatures, metrics] = await Promise.all([
    listJoinRequests(),
    listTeam(),
    getDisabledFeatures(studio.id),
    getSettingsMetrics(),
  ])
  const pendingRequests = requestsResult.success ? requestsResult.data.length : 0
  const teamSize = teamResult.success ? teamResult.data.length : 1

  return (
    <div>
      <InvitationBanner invitations={myInvitations} />
      <FeedbackBanner />
      <StudioControlCenter
        studio={studio}
        status={status}
        metrics={metrics}
        pendingRequests={pendingRequests}
        teamSize={teamSize}
        disabledFeatures={disabledFeatures}
      />
    </div>
  )
}
