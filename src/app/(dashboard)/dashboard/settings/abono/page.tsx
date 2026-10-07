import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { AbonoForm } from '@/components/settings/abono-form'

export default async function AbonoSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  const mode = studio.depositMode === 'fixed' || studio.depositMode === 'percent' ? studio.depositMode : ''
  return <AbonoForm depositMode={mode} depositValue={studio.depositValue ?? undefined} />
}
