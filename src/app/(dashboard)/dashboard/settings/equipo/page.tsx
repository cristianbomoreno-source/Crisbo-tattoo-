import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { listJoinRequests, listTeam } from '@/actions/team'
import { listStudioInvitations } from '@/actions/collaborators'
import { PageHeader } from '@/components/shared/page-header'
import { EquipoPanel } from '@/components/settings/equipo-panel'

export default async function EquipoSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner' || studio.accountKind !== 'estudio') {
    redirect('/dashboard/settings')
  }

  const { invite } = await searchParams

  const [requestsResult, teamResult, invitationsResult] = await Promise.all([
    listJoinRequests(),
    listTeam(),
    listStudioInvitations(),
  ])

  return (
    <div>
      <PageHeader kicker={studio.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'} title="Equipo" />
      <EquipoPanel
        joinCode={studio.joinCode}
        maxArtists={studio.maxArtists}
        requests={requestsResult.success ? requestsResult.data : []}
        team={teamResult.success ? teamResult.data : []}
        invitations={invitationsResult.success ? invitationsResult.data : []}
        autoFocusInvite={invite === '1'}
      />
    </div>
  )
}
