import { getCampaignStats, getCustomCampaignStats, type CampaignStats } from '@/queries/campaign-stats'
import { getCustomCampaigns } from '@/queries/custom-campaigns'
import { CampaignHub, type HubBadge } from '@/components/campaigns/campaign-hub'
import { STATUS_LABEL } from '@/lib/campaigns/custom'
import type { CampaignRow } from '@/lib/campaigns/custom-send'

function badgeFor(c: CampaignRow): HubBadge {
  const label = STATUS_LABEL[c.status]
  if (c.status === 'scheduled' && c.scheduled_at) {
    const when = new Date(c.scheduled_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    return { label: `Programada · ${when}`, tone: 'pending' }
  }
  if (c.status === 'sending') return { label: `Enviando ${c.cursor}/${c.client_ids.length}`, tone: 'active' }
  if (c.status === 'awaiting_template') return { label, tone: 'pending' }
  if (c.status === 'sent') return { label, tone: 'done' }
  return { label, tone: 'off' }
}

export default async function CampaignsPage() {
  const [nt, bono, custom] = await Promise.all([
    getCampaignStats('nuevos-trazos'),
    getCampaignStats('bono'),
    getCustomCampaigns(),
  ])
  const rows = custom.success ? custom.data : []
  const customStats = await Promise.all(rows.map((c) => getCustomCampaignStats(c)))
  const campaigns: CampaignStats[] = [...customStats, nt, bono].flatMap((r) => (r.success ? [r.data] : []))
  const badges = Object.fromEntries(rows.map((c) => [`c/${c.id}`, badgeFor(c)]))
  const failed = [nt, bono, custom].find((r) => !r.success)
  return <CampaignHub campaigns={campaigns} badges={badges} error={failed && !failed.success ? failed.error.message : null} />
}
