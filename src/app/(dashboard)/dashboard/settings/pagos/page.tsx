import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { PagosForm } from '@/components/settings/pagos-form'

export default async function PagosSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return <PagosForm initialMethods={studio.paymentMethods ?? []} />
}
