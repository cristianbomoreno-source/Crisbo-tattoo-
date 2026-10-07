import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getExpenses } from '@/queries/expenses'
import { GastosPanel } from '@/components/settings/gastos-panel'

export default async function GastosSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const result = await getExpenses()
  const expenses = result.success ? result.data : []

  return <GastosPanel expenses={expenses} />
}
