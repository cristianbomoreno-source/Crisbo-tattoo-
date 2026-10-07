import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { ArtistaForm } from '@/components/settings/artista-form'

export default async function ArtistaSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return (
    <ArtistaForm
      name={studio.artistName ?? ''}
      styles={studio.styles ?? []}
      experienceRange={studio.experienceRange ?? ''}
      fullTime={studio.fullTime ?? undefined}
      ownStudio={studio.ownStudio ?? undefined}
    />
  )
}
