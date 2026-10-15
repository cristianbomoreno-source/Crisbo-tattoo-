import { getCampaignRecipients } from '@/queries/campaigns'
import { getCurrentStudio } from '@/queries/studio'
import { getCampaignTemplateStatuses } from '@/actions/campaigns'
import { CampaignView } from '@/components/inbox/campaign-view'

export default async function CampaignsPage() {
  const studio = await getCurrentStudio()
  const isOwner = studio?.role === 'owner'
  const [result, templates] = await Promise.all([
    getCampaignRecipients(),
    isOwner ? getCampaignTemplateStatuses() : null,
  ])
  return (
    <CampaignView
      recipients={result.success ? result.data : []}
      error={result.success ? null : result.error.message}
      isOwner={isOwner}
      templates={templates?.success ? templates.data : []}
    />
  )
}
