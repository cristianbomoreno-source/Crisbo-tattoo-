import { Calendar, CreditCard, Clock, MessageCircle } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { Reveal } from '@/components/quote-landing/reveal'
import { SectionArrow } from '@/components/quote-landing/section-arrow'
import { QuoteNegotiateButton } from '@/components/quote-landing/quote-negotiate-button'

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-white/8 py-3.5 first:border-t-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/45">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

export function QuoteInvestment({ quote, artistName }: { quote: QuoteTemplateData; artistName: string }) {
  return (
    <section id="inversion" className="px-5 pt-16">
      <Reveal className="rounded-3xl border border-white/8 bg-card p-6">
        <p className="text-xs tracking-wide text-white/50 uppercase">Inversión del proyecto</p>
        <p className="mt-2 font-title text-4xl text-white">
          {quote.isCourtesy ? 'Cortesía' : `$${Math.round(quote.price).toLocaleString('es-CO')}`}
        </p>

        <div className="mt-4">
          {!quote.isCourtesy && (
            <Row
              icon={<CreditCard className="size-4" />}
              label="Abono para reservar"
              value={`$${Math.round(quote.depositAmount).toLocaleString('es-CO')} (${quote.depositPercentage}%)`}
            />
          )}
          <Row icon={<Calendar className="size-4" />} label="Sesiones" value={String(quote.sessionCount)} />
          {quote.avgSessionDuration && (
            <Row icon={<Clock className="size-4" />} label="Duración aprox." value={quote.avgSessionDuration} />
          )}
          {quote.paymentMethodsLine && (
            <Row icon={<CreditCard className="size-4" />} label="Forma de pago" value={quote.paymentMethodsLine} />
          )}
        </div>

        {quote.priceNegotiable && !quote.isCourtesy && (
          <QuoteNegotiateButton
            artistName={artistName}
            price={quote.price}
            whatsappPhone={quote.whatsapp}
            color={quote.templateColor}
          />
        )}

        {quote.waLink && (
          <a
            href={quote.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm text-white/50"
          >
            <MessageCircle className="size-3.5" />
            ¿Tienes dudas? Escríbeme por WhatsApp
          </a>
        )}
      </Reveal>
      <SectionArrow targetId="incluye" color={quote.templateColor} />
    </section>
  )
}
