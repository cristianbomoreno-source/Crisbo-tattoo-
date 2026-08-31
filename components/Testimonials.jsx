"use client";

import { useEffect, useRef } from "react";
import { Star, ArrowRight } from "lucide-react";

const testimonials = [
  {
    name: "Juan S.",
    text: "Crisbo es un artista increible. El diseno supero mis expectativas y el proceso fue muy profesional. Desde la primera conversacion supe que estaba en buenas manos.",
    source: "Google",
  },
  {
    name: "Daniela R.",
    text: "La dedicacion y el detalle con el que trabaja Crisbo se notan en cada trazo. Entendio exactamente lo que queria y lo convirtio en algo mejor de lo que imagine.",
    source: "Google",
  },
  {
    name: "Andres M.",
    text: "Excelencia en cada sesion. Higiene, calidad y un resultado increible. El estudio es muy comodo y el proceso de cicatrizacion fue perfecto con su seguimiento.",
    source: "Google",
  },
];

export default function Testimonials() {
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
      className="py-20 md:py-32 lg:py-40 px-5 md:px-8 lg:px-12 bg-bg-secondary"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="reveal mb-16 md:mb-24">
          <h2 className="font-display text-section uppercase leading-[0.9]">
            LO QUE DICEN<br />
            DESPUES DE<br />
            <span className="text-ink-muted">VIVIRLO.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`reveal delay-${i + 1}`}
            >
              {/* Quote Mark */}
              <span className="font-display text-8xl md:text-9xl text-ink/10 leading-none select-none">
                &ldquo;
              </span>

              {/* Text */}
              <p className="text-ink text-lg md:text-xl leading-relaxed -mt-12 md:-mt-16">
                {t.text}
              </p>

              {/* Author */}
              <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-muted">{t.source}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          size={12}
                          className="text-sage fill-sage"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="reveal delay-4 mt-16 md:mt-24">
          <a
            href="https://g.page/r/CZlX7tRwMbEJEB0/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm tracking-wider text-ink hover:text-sage transition-colors group"
          >
            VER TODAS LAS RESENAS
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
