import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { MetasForm } from '@/components/settings/metas-form'

export default async function MetasSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <MetasForm
      quotedValue={studio.monthlyGoalQuotedValue}
      approvedProjects={studio.monthlyGoalApprovedProjects}
      scheduledSessions={studio.monthlyGoalScheduledSessions}
    />
  )
}
