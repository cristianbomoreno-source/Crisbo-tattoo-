import { getCampaignStats } from '@/queries/campaign-stats'
import { CampaignHub } from '@/components/campaigns/campaign-hub'

export default async function CampaignsPage() {
  const results = await Promise.all([getCampaignStats('nuevos-trazos'), getCampaignStats('bono')])
  const failed = results.find((r) => !r.success)
  return (
    <CampaignHub
      campaigns={results.flatMap((r) => (r.success ? [r.data] : []))}
      error={failed && !failed.success ? failed.error.message : null}
    />
  )
}
