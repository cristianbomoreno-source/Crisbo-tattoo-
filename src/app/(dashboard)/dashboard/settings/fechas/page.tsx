import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getBlockedDays } from '@/queries/blocked-days'
import { FechasPanel } from '@/components/settings/fechas-panel'

export default async function FechasSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  // Rango amplio: desde hace 1 mes (para ver los recientes) hasta +2 años.
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear() + 2, now.getMonth(), 1).toISOString().slice(0, 10)
  const result = await getBlockedDays(from, to)
  const blockedDays = result.success ? result.data : []

  return <FechasPanel blockedDays={blockedDays} />
}
