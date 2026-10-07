import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getStudioDashboardData } from '@/queries/studio-dashboard'
import { PageHeader } from '@/components/shared/page-header'
import { StudioDashboard } from '@/components/studio/studio-dashboard'

export default async function StudioDashboardPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner' || studio.accountKind !== 'estudio') {
    redirect('/dashboard')
  }

  const data = await getStudioDashboardData()

  return (
    <div>
      <PageHeader kicker={studio.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'} title="Dashboard del estudio" />
      <StudioDashboard data={data} />
    </div>
  )
}
