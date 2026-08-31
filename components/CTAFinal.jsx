"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

export default function CTAFinal() {
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
      className="py-24 md:py-40 lg:py-52 px-5 md:px-8 lg:px-12 bg-bg grain overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto text-center relative">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="font-display text-[200px] md:text-[300px] lg:text-[400px] text-ink/[0.02] leading-none">
            CRISBO
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h2 className="reveal font-display text-section md:text-[clamp(50px,8vw,120px)] uppercase leading-[0.9]">
            TU IDEA<br />
            PUEDE SER<br />
            EL PROXIMO<br />
            <span className="text-sage">PROYECTO.</span>
          </h2>

          <p className="reveal delay-1 mt-8 md:mt-12 text-ink-muted text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Cuentame que tienes en mente. Yo te ayudo a convertirlo en una
            composicion pensada especificamente para tu cuerpo.
          </p>

          <a
            href="https://wa.me/573202107769"
            target="_blank"
            rel="noopener noreferrer"
            className="reveal delay-2 inline-flex items-center justify-center gap-3 mt-10 md:mt-14 bg-sage text-bg text-base md:text-lg font-medium tracking-wider px-10 md:px-14 py-5 md:py-6 hover:bg-sage-dark transition-colors group"
          >
            COTIZA TU TATUAJE
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="reveal delay-3 mt-12 md:mt-16 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-ink-muted">
            <span className="label">BOGOTA, COLOMBIA</span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-ink-muted" />
            <span className="label">AGENDA 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
