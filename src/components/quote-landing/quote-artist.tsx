import { Sparkles } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

export function QuoteArtist({
  quote,
  artistName,
  experienceRange,
  fullTime,
}: {
  quote: QuoteTemplateData
  artistName: string
  experienceRange: string | null
  fullTime: boolean | null
}) {
  return (
    <section id="tatuador" className="px-5 pt-16">
      <Reveal>
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: quote.templateColor }} />
          <span className="font-display text-xs font-semibold tracking-wider text-white/60 uppercase">
            ¿Quién hará tu tatuaje?
          </span>
        </div>

        <div className="rounded-3xl border border-white/8 bg-card p-6 text-center">
          {quote.studioLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quote.studioLogoUrl}
              alt={artistName}
              className="mx-auto size-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="mx-auto flex size-20 items-center justify-center rounded-full font-display text-2xl font-semibold text-black"
              style={{ backgroundColor: quote.templateColor }}
            >
              {artistName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="mt-4 font-display text-xl text-white">
            Hola, soy <span className="italic">{artistName}</span>.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Cada tatuaje que realizo tiene una historia detrás. Mi objetivo es que salgas orgulloso de llevar una
            pieza única, hecha pensando en ti.
          </p>

          {(experienceRange || fullTime !== null) && (
            <div className="mt-5 flex justify-center gap-6 border-t border-white/8 pt-5">
              {experienceRange && (
                <div>
                  <p className="font-title text-xl" style={{ color: quote.templateColor }}>
                    {experienceRange}
                  </p>
                  <p className="text-xs text-white/45">de experiencia</p>
                </div>
              )}
              {fullTime !== null && (
                <div>
                  <p className="font-title text-xl" style={{ color: quote.templateColor }}>
                    {fullTime ? '100%' : '·'}
                  </p>
                  <p className="text-xs text-white/45">comprometido contigo</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Reveal>
      <SectionArrow targetId="reserva" color={quote.templateColor} />
    </section>
  )
}
