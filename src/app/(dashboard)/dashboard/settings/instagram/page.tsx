import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getInstagramAccountStatus } from '@/queries/whatsapp'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { InstagramConnectCard } from '@/components/settings/instagram-connect-card'

export default async function InstagramSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  const account = await getInstagramAccountStatus()
  return (
    <SettingsSubpage
      title="Instagram"
      description="Conecta la cuenta del estudio para responder los mensajes directos de Instagram desde Mensajes."
    >
      <InstagramConnectCard
        account={account}
        webhookConfigured={Boolean(
          (process.env.INSTAGRAM_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN) &&
            (process.env.INSTAGRAM_APP_SECRET || process.env.WHATSAPP_APP_SECRET)
        )}
      />
    </SettingsSubpage>
  )
}
