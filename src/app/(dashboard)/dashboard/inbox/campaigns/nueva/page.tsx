import { getCampaignTemplates } from '@/actions/custom-campaigns'
import { CampaignBuilder } from '@/components/campaigns/campaign-builder'

export default async function NewCampaignPage() {
  const res = await getCampaignTemplates()
  return <CampaignBuilder templates={res.success ? res.data : []} error={res.success ? null : res.error.message} />
}
