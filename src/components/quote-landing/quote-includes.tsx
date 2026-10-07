import { Gem, UserCheck, ClipboardList, ShieldCheck, Crown, HeartHandshake } from 'lucide-react'
import { EXPERIENCE_INCLUDES } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

const ICONS = [Gem, UserCheck, ClipboardList, ShieldCheck, Crown, HeartHandshake]

export function QuoteIncludes({ color }: { color: string }) {
  return (
    <section id="incluye" className="px-5 pt-16">
      <Reveal>
        <h2 className="mb-5 font-display text-2xl font-medium text-white">¿Qué incluye trabajar conmigo?</h2>
        <div className="grid grid-cols-2 gap-3">
          {EXPERIENCE_INCLUDES.map((text, i) => {
            const Icon = ICONS[i % ICONS.length] ?? Gem
            return (
              <div key={text} className="rounded-2xl border border-white/8 bg-card p-4">
                <Icon className="mb-3 size-5" style={{ color }} />
                <p className="text-sm font-medium text-white">{text}</p>
              </div>
            )
          })}
        </div>
      </Reveal>
      <SectionArrow targetId="tatuador" color={color} />
    </section>
  )
}
