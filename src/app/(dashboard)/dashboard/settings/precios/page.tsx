import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { PreciosForm } from '@/components/settings/precios-form'

export default async function PreciosSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return <PreciosForm presets={studio.pricePresets} slotIntervalMinutes={studio.slotIntervalMinutes} />
}
