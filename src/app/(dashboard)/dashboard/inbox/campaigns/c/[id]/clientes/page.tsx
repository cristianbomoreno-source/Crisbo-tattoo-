import { getCustomCampaignRecipients } from '@/queries/custom-campaigns'
import { CustomCampaignList } from '@/components/campaigns/custom-campaign-list'

export default async function CustomCampaignClientsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getCustomCampaignRecipients(id)
  if (!res.success) return <p className="p-4 text-sm text-destructive">{res.error.message}</p>
  return <CustomCampaignList id={id} name={res.data.campaign.name} recipients={res.data.recipients} />
}
