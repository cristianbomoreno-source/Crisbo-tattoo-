import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getWhatsAppAccountStatus } from '@/queries/whatsapp'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { WhatsAppConnectCard } from '@/components/settings/whatsapp-connect-card'

export default async function WhatsAppSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  const account = await getWhatsAppAccountStatus()
  return (
    <SettingsSubpage
      title="WhatsApp Business"
      description="Conecta tu número de la API de WhatsApp para responder a tus clientes desde Mensajes."
    >
      <WhatsAppConnectCard account={account} verifyTokenConfigured={Boolean(process.env.WHATSAPP_VERIFY_TOKEN)} />
    </SettingsSubpage>
  )
}
