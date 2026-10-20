import { getCampaignStats } from '@/queries/campaign-stats'
import { CampaignStatsView } from '@/components/campaigns/campaign-stats-view'

export default async function CampaignStatsPage() {
  const res = await getCampaignStats('bono')
  if (!res.success) return <p className="p-4 text-sm text-destructive">{res.error.message}</p>
  return <CampaignStatsView stats={res.data} listHref="/dashboard/inbox/campaigns/bono/clientes" />
}
