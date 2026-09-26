"use client";

import { Calendar, MapPin, Phone, Instagram, Shield, HelpCircle } from "lucide-react";

export default function InfoSection() {
  const faqs = [
    {
      q: "Como funciona el sorteo?",
      a: "El sorteo se realiza con la Loteria de Colombia el 24 de octubre 2026. El numero ganador sera las ultimas 3 cifras del premio mayor.",
    },
    {
      q: "Hasta cuando puedo comprar?",
      a: "Puedes comprar hasta el 23 de octubre a las 11:59 PM o hasta que se agoten los 200 cupos.",
    },
    {
      q: "Como reclamo mi premio?",
      a: "Si ganas, te contactaremos al WhatsApp registrado. El tatuaje se puede agendar hasta diciembre 2026.",
    },
    {
      q: "Puedo cambiar mi numero?",
      a: "Una vez confirmado el pago, no se pueden hacer cambios. Asegurate de elegir bien!",
    },
  ];

  return (
    <section className="py-20 px-mobile bg-surface-light grain">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Info del evento */}
        <div>
          <div className="text-center mb-8">
            <span className="label text-xs">03 / DETALLES</span>
            <h2 className="font-gothic text-poster-sm text-gold mt-2">INFO DEL SORTEO</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-editorial p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-gold flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-bg" />
              </div>
              <div>
                <h4 className="font-display text-cream">FECHA</h4>
                <p className="text-muted text-sm">24 de octubre, 2026</p>
                <p className="text-xs text-gold mt-1">Con la Loteria de Colombia</p>
              </div>
            </div>

            <div className="card-editorial p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-teal flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-cream" />
              </div>
              <div>
                <h4 className="font-display text-cream">ESTUDIO</h4>
                <p className="text-muted text-sm">Cl. 137b #57b - 39, piso 2</p>
                <p className="text-xs text-teal mt-1">Bogota, Colombia</p>
              </div>
            </div>

            <div className="card-editorial p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-surface flex items-center justify-center flex-shrink-0 border border-line">
                <Phone className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="font-display text-cream">CONTACTO</h4>
                <a href="https://wa.me/573202107769" className="text-gold text-sm hover:underline">
                  +57 320 210 7769
                </a>
              </div>
            </div>

            <div className="card-editorial p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-surface flex items-center justify-center flex-shrink-0 border border-line">
                <Instagram className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="font-display text-cream">INSTAGRAM</h4>
                <a
                  href="https://instagram.com/crisbotattoo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold text-sm hover:underline"
                >
                  @crisbotattoo
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <div className="text-center mb-8">
            <span className="label text-xs">04 / FAQ</span>
            <h2 className="font-gothic text-poster-sm text-gold mt-2">PREGUNTAS</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card-editorial p-5">
                <h4 className="font-display text-cream flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-gold" />
                  {faq.q}
                </h4>
                <p className="text-muted text-sm pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legalidad */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted">
            <Shield className="w-4 h-4" />
            <span>Rifa autorizada - Todos los premios garantizados</span>
          </div>
        </div>
      </div>
    </section>
  );
}
