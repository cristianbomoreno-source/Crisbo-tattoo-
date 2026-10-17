import { getBonoCampaignData } from '@/queries/bono-campaign'
import { getBonoTemplateStatus } from '@/actions/bono-campaign'
import { BonoCampaignView } from '@/components/inbox/bono-campaign-view'

export default async function BonoCampaignPage() {
  const [result, template] = await Promise.all([getBonoCampaignData(), getBonoTemplateStatus()])
  return (
    <BonoCampaignView
      recipients={result.success ? result.data : []}
      error={result.success ? null : result.error.message}
      template={template.success ? template.data : null}
    />
  )
}
