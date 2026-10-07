import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

export function QuoteGallery({ quote }: { quote: QuoteTemplateData }) {
  if (quote.referencePhotos.length === 0) return null

  return (
    <section id="galeria" className="pt-14">
      <Reveal className="px-5">
        <h2 className="mb-5 font-display text-2xl font-medium text-white">Así imaginamos tu tatuaje</h2>
      </Reveal>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {quote.referencePhotos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`Referencia ${i + 1}`}
            className="h-80 w-64 shrink-0 snap-center rounded-2xl border border-white/8 object-cover"
          />
        ))}
      </div>
      <SectionArrow targetId="proceso" color={quote.templateColor} />
    </section>
  )
}
