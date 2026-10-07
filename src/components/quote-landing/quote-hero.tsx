import { SectionArrow } from '@/components/quote-landing/section-arrow'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'

export function QuoteHero({
  quote, artistName, isProject,
}: {
  quote: QuoteTemplateData
  artistName: string
  isProject: boolean
}) {
  const firstName = quote.clientName.split(' ')[0]

  return (
    <section id="hero" className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
      {quote.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={quote.photoUrl}
          alt={quote.projectLabel}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-card" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pt-24 pb-10">
        {isProject && (
          <span
            className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ borderColor: quote.templateColor, color: quote.templateColor }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: quote.templateColor }} />
            Proyecto en marcha
          </span>
        )}
        <p
          className="font-display text-sm font-semibold tracking-wide"
          style={{ color: quote.templateColor }}
        >
          Hola {firstName} 👋
        </p>
        <h1 className="mt-2 font-title text-5xl leading-[0.95] tracking-tight text-white uppercase">
          {isProject ? 'Tu proyecto está en marcha.' : 'Este es tu proyecto.'}
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
          {isProject
            ? 'Aquí puedes ver el estado y la próxima sesión de tu tatuaje.'
            : 'Preparé cada detalle pensando en la idea que quieres llevar en tu piel.'}
        </p>

        <p className="mt-8 font-display text-lg text-white/90 italic">{artistName}</p>
        <p className="text-xs tracking-wide text-white/50 uppercase">{quote.studioName}</p>

        <div className="mt-10">
          <SectionArrow targetId="carta" color={quote.templateColor} />
        </div>
      </div>
    </section>
  )
}
