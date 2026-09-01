"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "¿Cuánto debo abonar para agendar?",
    a: "El abono depende del tamaño y complejidad del diseño. Se define al confirmar la propuesta y se descuenta del valor final del proyecto.",
  },
  {
    q: "¿Cuánto tarda el diseño?",
    a: "El tiempo varía según la complejidad de la idea. Normalmente se entrega antes de la fecha de la cita para que puedas revisarlo con calma.",
  },
  {
    q: "¿Hacen diseños personalizados?",
    a: "Sí, cada diseño se crea desde cero a partir de tu idea, referencias o historia. No repito diseños entre clientes.",
  },
  {
    q: "¿Aceptan retoques?",
    a: "Sí, incluyo un control de cicatrización con posibilidad de retoque si es necesario. Es parte del proceso.",
  },
  {
    q: "¿Cómo es el proceso de agendamiento?",
    a: "Escríbeme por WhatsApp o Instagram, conversamos sobre tu idea, defino una cotización y agendamos tu cita con el abono correspondiente.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("visible"), i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-section px-5 md:px-8 lg:px-12 bg-bg"
    >
      <div className="max-w-container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Title */}
          <div className="reveal">
            <p className="label-gold mb-4">04 / FAQ</p>
            <h2 className="font-display text-display-lg uppercase">
              PREGUNTAS<br />
              <span className="text-muted">FRECUENTES.</span>
            </h2>
            <p className="mt-8 text-muted max-w-md">
              Antes de agendar, probablemente tengas algunas dudas.
              Aquí te respondo las más comunes.
            </p>
          </div>

          {/* Right - Accordion */}
          <div className="reveal delay-1">
            <div className="divide-y divide-line">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className="py-6">
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="w-full flex items-start justify-between gap-4 text-left group"
                      aria-expanded={isOpen}
                    >
                      <span className="text-ink text-lg group-hover:text-gold transition-colors">
                        {faq.q}
                      </span>
                      <span className="flex-shrink-0 mt-1 text-muted">
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-muted leading-relaxed pr-8">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
