import { MessageCircle } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Logo } from '@/components/shared/logo'
import { Reveal } from '@/components/quote-landing/reveal'

export function QuoteFinalCta({ quote }: { quote: QuoteTemplateData }) {
  return (
    <section id="reserva" className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <Reveal>
        <p className="font-title text-3xl leading-tight text-white uppercase">
          ¿Listo para comenzar
          <br />
          esta historia juntos?
        </p>
        <p className="mt-3 text-sm" style={{ color: quote.templateColor }}>
          Estoy emocionado de empezar este proyecto contigo.
        </p>

        {quote.waLink && (
          <>
            <a
              href={quote.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-full px-8 text-[15px] font-semibold text-black"
              style={{ backgroundColor: quote.templateColor }}
            >
              Reservar mi proyecto
            </a>
            <a
              href={quote.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/50"
            >
              <MessageCircle className="size-3.5" />
              ¿Tienes dudas? Escríbeme por WhatsApp
            </a>
          </>
        )}
      </Reveal>

      <Logo full className="mt-16 text-lg opacity-60" subtitle="Arte que permanece contigo" />
    </section>
  )
}
