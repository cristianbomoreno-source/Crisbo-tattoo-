import { getCustomCampaign } from '@/queries/custom-campaigns'
import { getCustomCampaignStats } from '@/queries/campaign-stats'
import { CampaignStatsView } from '@/components/campaigns/campaign-stats-view'
import { CustomCampaignBanner } from '@/components/campaigns/custom-campaign-banner'

export default async function CustomCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getCustomCampaign(id)
  if (!res.success) return <p className="p-4 text-sm text-destructive">{res.error.message}</p>
  const c = res.data
  const stats = await getCustomCampaignStats(c)
  if (!stats.success) return <p className="p-4 text-sm text-destructive">{stats.error.message}</p>
  return (
    <CampaignStatsView
      stats={stats.data}
      listHref={`/dashboard/inbox/campaigns/c/${id}/clientes`}
      banner={
        <CustomCampaignBanner
          id={c.id}
          status={c.status}
          scheduledAt={c.scheduled_at}
          planned={c.client_ids.length}
          cursor={c.cursor}
          sentCount={c.sent_count}
          failedCount={c.failed_count}
          templateName={c.template_name}
        />
      }
    />
  )
}
