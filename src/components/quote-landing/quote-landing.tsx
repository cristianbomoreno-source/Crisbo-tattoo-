import type { QuoteLandingData } from '@/queries/quote-links'
import { QuoteHero } from '@/components/quote-landing/quote-hero'
import { QuoteMessage } from '@/components/quote-landing/quote-message'
import { QuoteSummary } from '@/components/quote-landing/quote-summary'
import { QuoteSessionCta } from '@/components/quote-landing/quote-session-cta'
import { QuoteGallery } from '@/components/quote-landing/quote-gallery'
import { QuoteProcess } from '@/components/quote-landing/quote-process'
import { QuoteInvestment } from '@/components/quote-landing/quote-investment'
import { QuoteIncludes } from '@/components/quote-landing/quote-includes'
import { QuoteArtist } from '@/components/quote-landing/quote-artist'
import { QuoteFinalCta } from '@/components/quote-landing/quote-final-cta'

/**
 * Landing privada de un proyecto (reemplaza a la imagen que se enviaba por
 * WhatsApp — ver `send-quote-whatsapp.tsx` y CHANGELOG). Cada sección
 * consume `QuoteTemplateData`, la misma fuente de datos que ya alimenta la
 * imagen OG y el PDF: no se duplica ni un solo dato de la cotización.
 */
export function QuoteLanding({ data }: { data: QuoteLandingData }) {
  const { quote, artistName, experienceRange, fullTime, isProject, nextSession } = data

  return (
    <div className="bg-background pb-16">
      <QuoteHero quote={quote} artistName={artistName} isProject={isProject} />
      <QuoteMessage quote={quote} artistName={artistName} />
      {nextSession && <QuoteSessionCta quote={quote} artistName={artistName} session={nextSession} />}
      <QuoteSummary quote={quote} />
      <QuoteGallery quote={quote} />
      <QuoteProcess color={quote.templateColor} />
      <QuoteInvestment quote={quote} artistName={artistName} />
      <QuoteIncludes color={quote.templateColor} />
      <QuoteArtist quote={quote} artistName={artistName} experienceRange={experienceRange} fullTime={fullTime} />
      <QuoteFinalCta quote={quote} />
    </div>
  )
}
