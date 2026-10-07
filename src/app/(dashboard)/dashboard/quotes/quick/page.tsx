import { getCurrentStudio } from '@/queries/studio'
import { QuickQuoteForm } from '@/components/quotes/quick-quote-form'

export default async function QuickQuotePage() {
  const studio = await getCurrentStudio()

  return (
    <QuickQuoteForm
      styles={studio?.styles ?? []}
      presets={studio?.pricePresets ?? []}
    />
  )
}
