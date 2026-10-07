import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { QuoteLetterForm } from '@/components/settings/quote-letter-form'

export default async function QuoteLetterSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')
  return <QuoteLetterForm letterMessage={studio.quoteLetterMessage} priceNegotiable={studio.quotePriceNegotiable} />
}
