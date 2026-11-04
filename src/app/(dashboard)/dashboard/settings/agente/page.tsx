import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadAdAgentSettings } from '@/lib/ad-agent/store'
import { AdAgentForm } from '@/components/settings/ad-agent-form'

export default async function AgenteSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  const settings = await loadAdAgentSettings(createAdminClient(), studio.id)
  return <AdAgentForm enabled={settings.enabled} knowledge={settings.knowledge} />
}
