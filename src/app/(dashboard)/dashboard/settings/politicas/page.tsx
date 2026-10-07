import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { PoliticasForm } from '@/components/settings/politicas-form'

export default async function PoliticasSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <PoliticasForm
      paymentPolicy={studio.paymentPolicy ?? ''}
      cancellationPolicy={studio.cancellationPolicy ?? ''}
      rules={studio.studioRules ?? []}
    />
  )
}
