import { Mail } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

export function QuoteMessage({ quote, artistName }: { quote: QuoteTemplateData; artistName: string }) {
  return (
    <section id="carta" className="px-5 pt-16">
      <Reveal className="rounded-3xl border border-white/8 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Mail className="size-4" style={{ color: quote.templateColor }} />
          <span className="font-display text-xs font-semibold tracking-wider text-white/60 uppercase">
            Una carta para ti
          </span>
        </div>

        <div className="space-y-3 whitespace-pre-line text-[15px] leading-relaxed text-white/80">
          {quote.letterMessage}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5">
          {quote.studioLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.studioLogoUrl} alt={artistName} className="size-10 rounded-full object-cover" />
          ) : (
            <div
              className="flex size-10 items-center justify-center rounded-full font-display text-sm font-semibold text-black"
              style={{ backgroundColor: quote.templateColor }}
            >
              {artistName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-display italic text-lg" style={{ color: quote.templateColor }}>
            {artistName}
          </p>
        </div>
      </Reveal>
      <SectionArrow targetId="resumen" color={quote.templateColor} />
    </section>
  )
}
