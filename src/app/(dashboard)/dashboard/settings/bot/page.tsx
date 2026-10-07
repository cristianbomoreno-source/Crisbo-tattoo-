import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { BotSettingsCard } from '@/components/settings/bot-settings-card'
import { SettingsSubpage } from '@/components/settings/settings-subpage'

export default async function BotSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <SettingsSubpage title="Tu bot" description="El link donde tus clientes piden cita solos.">
      <BotSettingsCard slug={studio.slug} whatsappPhone={studio.whatsappPhone} instagram={studio.instagram} botAskAvailability={studio.botAskAvailability} />
    </SettingsSubpage>
  )
}
