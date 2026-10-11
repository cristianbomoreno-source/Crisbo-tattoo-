import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getQuickReplies, getWhatsAppAccountStatus } from '@/queries/whatsapp'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { WhatsAppConnectCard } from '@/components/settings/whatsapp-connect-card'
import { WhatsAppDataFormCard } from '@/components/settings/whatsapp-data-form-card'
import { QuickRepliesCard } from '@/components/settings/quick-replies-card'

export default async function WhatsAppSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  const [account, quickReplies] = await Promise.all([getWhatsAppAccountStatus(), getQuickReplies()])
  return (
    <SettingsSubpage
      title="WhatsApp Business"
      description="Conecta tu número de la API de WhatsApp para responder a tus clientes desde Mensajes."
    >
      <div className="space-y-4">
        {account && <QuickRepliesCard replies={quickReplies} />}
        {account && <WhatsAppDataFormCard account={account} studioName={studio.name} />}
        <WhatsAppConnectCard account={account} verifyTokenConfigured={Boolean(process.env.WHATSAPP_VERIFY_TOKEN)} />
      </div>
    </SettingsSubpage>
  )
}
