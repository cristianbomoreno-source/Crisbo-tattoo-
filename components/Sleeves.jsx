"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

export default function Sleeves() {
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
      className="py-20 md:py-32 lg:py-40 px-5 md:px-8 lg:px-12 bg-sage"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Content */}
          <div>
            <h2 className="reveal font-display text-section uppercase leading-[0.9] text-bg">
              ESTAS PENSANDO<br />
              EN UNA MANGA?
            </h2>

            <div className="reveal delay-1 mt-8 md:mt-12 space-y-6">
              <p className="text-bg/90 text-lg md:text-xl leading-relaxed">
                Una manga no deberia construirse tatuaje por tatuaje sin planificacion.
              </p>
              <p className="text-bg/70 leading-relaxed">
                Disenamos primero la historia, los elementos principales, la composicion
                y como todo va a recorrer el brazo antes de comenzar.
              </p>
            </div>

            <a
              href="https://wa.me/573202107769"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal delay-2 inline-flex items-center gap-2 mt-10 bg-bg text-sage text-sm font-medium tracking-wider px-8 py-4 hover:bg-ink transition-colors group"
            >
              DESCUBRE COMO DISENAMOS UNA MANGA
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right - Editorial Document Style */}
          <div className="reveal delay-2 relative">
            <div className="bg-bg/10 border border-bg/20 p-8 md:p-12">
              {/* Document Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-bg/20">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-bg/60 uppercase">Metodologia</p>
                  <p className="font-display text-2xl text-bg mt-1">SLEEVE PROJECT</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-[0.2em] text-bg/60 uppercase">Crisbo Tattoo</p>
                  <p className="text-sm text-bg/80">Bogota, CO</p>
                </div>
              </div>

              {/* Process Steps */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="font-display text-2xl text-bg/40">01</span>
                  <div>
                    <p className="font-medium text-bg">Narrativa</p>
                    <p className="text-sm text-bg/70">Definimos la historia que contara tu manga</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-display text-2xl text-bg/40">02</span>
                  <div>
                    <p className="font-medium text-bg">Composicion</p>
                    <p className="text-sm text-bg/70">Mapeamos como fluiran los elementos</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-display text-2xl text-bg/40">03</span>
                  <div>
                    <p className="font-medium text-bg">Sesiones</p>
                    <p className="text-sm text-bg/70">Planificamos cada sesion estrategicamente</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-display text-2xl text-bg/40">04</span>
                  <div>
                    <p className="font-medium text-bg">Obra completa</p>
                    <p className="text-sm text-bg/70">El resultado final es una pieza cohesiva</p>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="mt-8 pt-6 border-t border-bg/20 flex items-center justify-between">
                <p className="text-[10px] tracking-[0.2em] text-bg/60 uppercase">Custom Projects</p>
                <p className="text-[10px] tracking-[0.2em] text-bg/60 uppercase">Black & Grey / Realism</p>
              </div>
            </div>

            {/* Decorative corner */}
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-bg/30" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-bg/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
