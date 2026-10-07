import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { MensajesForm } from '@/components/settings/mensajes-form'

export default async function MensajesSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <MensajesForm
      quoteMessageTemplate={studio.quoteMessageTemplate}
      reminderBalanceTemplate={studio.reminderBalanceTemplate}
      reminderSessionTemplate={studio.reminderSessionTemplate}
      contactClientTemplate={studio.contactClientTemplate}
      botContactTemplate={studio.botContactTemplate}
      quoteConfirmTemplate={studio.quoteConfirmTemplate}
      bookingConfirmationTemplate={studio.bookingConfirmationTemplate}
    />
  )
}
