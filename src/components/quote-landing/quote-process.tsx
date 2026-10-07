import { PenTool, Zap, Repeat, ShieldCheck, Heart } from 'lucide-react'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'

const STEPS = [
  { icon: PenTool, title: 'Diseño', body: 'Desarrollamos el diseño junto a la idea que tienes en mente.' },
  { icon: Zap, title: 'Primera sesión', body: 'Iniciamos el tatuaje con todo el cuidado y precisión.' },
  { icon: Repeat, title: 'Sesiones siguientes', body: 'Continuamos avanzando hasta completar los detalles.' },
  { icon: ShieldCheck, title: 'Controles', body: 'Revisamos la evolución y hacemos ajustes si es necesario.' },
  { icon: Heart, title: 'Proyecto terminado', body: 'Tu tatuaje listo, con recomendaciones finales de cuidado.' },
] as const

export function QuoteProcess({ color }: { color: string }) {
  return (
    <section id="proceso" className="px-5 pt-16">
      <h2 className="mb-8 font-display text-2xl font-medium text-white">Así será el proceso</h2>
      <div className="relative pl-5">
        <div className="absolute top-1 bottom-1 left-[19px] w-px border-l border-dashed border-white/15" />
        <div className="space-y-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.05} className="relative flex gap-4">
              <div
                className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background"
                style={{ borderColor: color, color }}
              >
                <step.icon className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide" style={{ color }}>
                  {i + 1}
                </p>
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-0.5 text-sm text-white/55">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <SectionArrow targetId="inversion" color={color} />
    </section>
  )
}
