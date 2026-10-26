import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getExpenses } from '@/queries/expenses'
import { GastosPanel } from '@/components/settings/gastos-panel'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/validations/studio'

export default async function GastosSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const result = await getExpenses()
  const expenses = result.success ? result.data : []

  return (
    <GastosPanel
      expenses={expenses}
      accounts={studio.paymentMethods?.length ? studio.paymentMethods : [...PAYMENT_METHOD_OPTIONS]}
    />
  )
}
