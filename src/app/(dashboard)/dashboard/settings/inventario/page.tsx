import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getInventoryItems, getInventoryCategories } from '@/queries/inventory'
import { InventarioPanel } from '@/components/settings/inventario-panel'

export default async function InventarioSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const [itemsResult, categoriesResult] = await Promise.all([
    getInventoryItems(),
    getInventoryCategories(),
  ])
  const items = itemsResult.success ? itemsResult.data : []
  const categories = categoriesResult.success ? categoriesResult.data : []

  return <InventarioPanel items={items} categories={categories} />
}
