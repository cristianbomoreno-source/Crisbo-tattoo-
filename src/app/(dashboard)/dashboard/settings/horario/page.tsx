import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { HorarioForm } from '@/components/settings/horario-form'

export default async function HorarioSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <HorarioForm
      openDays={studio.openDays ?? []}
      openTime={studio.openTime ?? ''}
      closeTime={studio.closeTime ?? ''}
    />
  )
}
