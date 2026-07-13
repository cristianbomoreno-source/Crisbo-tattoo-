"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Juan S.",
    text: "Crisbo es un artista increíble. El diseño superó mis expectativas y el proceso fue muy profesional.",
  },
  {
    name: "Daniela R.",
    text: "La dedicación y el detalle con el que trabaja Crisbo se notan en cada trazo. Totalmente recomendado.",
  },
  {
    name: "Andrés M.",
    text: "Excelencia en cada sesión. Higiene, calidad y un resultado increíble. Volveré por más.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 className="font-display text-3xl sm:text-4xl tracking-wide flex items-center gap-4 mb-14">
          <span className="w-8 h-px bg-gold-2 inline-block" />
          LO QUE DICEN MIS CLIENTES
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-bg-grey border border-line/60 p-7 rounded-sm hover:-translate-y-1 hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-bg-secondary border border-line/60 flex items-center justify-center font-display text-gold-2">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide">{t.name}</p>
                  <div className="flex gap-0.5 text-gold-2 mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={12} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink/60 leading-relaxed pr-6">{t.text}</p>
              <span className="absolute bottom-3 right-5 font-brush text-4xl text-gold-2/30 select-none">
                &rdquo;
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
