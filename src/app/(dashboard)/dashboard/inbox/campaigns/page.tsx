import { getCampaignRecipients } from '@/queries/campaigns'
import { CampaignView } from '@/components/inbox/campaign-view'

export default async function CampaignsPage() {
  const result = await getCampaignRecipients()
  return <CampaignView recipients={result.success ? result.data : []} error={result.success ? null : result.error.message} />
}
