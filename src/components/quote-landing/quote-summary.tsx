import { Palette, MapPin, Calendar, Ruler, Clock } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

function Item({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card p-4">
      <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-white/5" style={{ color }}>
        {icon}
      </div>
      <p className="text-xs tracking-wide text-white/45 uppercase">{label}</p>
      <p className="mt-0.5 text-[15px] font-medium text-white">{value}</p>
    </div>
  )
}

export function QuoteSummary({ quote }: { quote: QuoteTemplateData }) {
  const items = [
    quote.style && { icon: <Palette className="size-4" />, label: 'Estilo', value: quote.style },
    quote.bodyZone && { icon: <MapPin className="size-4" />, label: 'Ubicación', value: quote.bodyZone },
    { icon: <Calendar className="size-4" />, label: 'Sesiones', value: `${quote.sessionCount} sesión${quote.sessionCount === 1 ? '' : 'es'}` },
    quote.size && { icon: <Ruler className="size-4" />, label: 'Tamaño aprox.', value: quote.size },
    quote.avgSessionDuration && { icon: <Clock className="size-4" />, label: 'Duración aprox.', value: quote.avgSessionDuration },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  if (items.length === 0) return null

  return (
    <section id="resumen" className="px-5 pt-14">
      <Reveal>
        <h2 className="mb-5 font-display text-2xl font-medium text-white">Tu proyecto</h2>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <Item key={item.label} {...item} color={quote.templateColor} />
          ))}
        </div>
      </Reveal>
      <SectionArrow targetId="galeria" color={quote.templateColor} />
    </section>
  )
}
