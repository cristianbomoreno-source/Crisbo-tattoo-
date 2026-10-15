import { getCampaignData } from '@/queries/campaigns'
import { getCurrentStudio } from '@/queries/studio'
import { getCampaignTemplateStatuses } from '@/actions/campaigns'
import { CampaignView } from '@/components/inbox/campaign-view'

export default async function CampaignsPage() {
  const studio = await getCurrentStudio()
  const isOwner = studio?.role === 'owner'
  const [result, templates] = await Promise.all([
    getCampaignData(),
    isOwner ? getCampaignTemplateStatuses() : null,
  ])
  return (
    <CampaignView
      recipients={result.success ? result.data.recipients : []}
      slotsTaken={result.success ? result.data.slotsTaken : 0}
      error={result.success ? null : result.error.message}
      isOwner={isOwner}
      templates={templates?.success ? templates.data : []}
    />
  )
}
