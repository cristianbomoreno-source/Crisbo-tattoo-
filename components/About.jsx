"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function About() {
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
      id="sobre-mi"
      className="py-20 md:py-32 lg:py-40 px-5 md:px-8 lg:px-12 bg-bg"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Label */}
        <div className="reveal mb-8 md:mb-12">
          <p className="label">01 / THE ARTIST</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left - Photo */}
          <div className="reveal delay-1 relative">
            <div className="aspect-[4/5] relative overflow-hidden">
              {/* PLACEHOLDER: Foto de Crisbo trabajando */}
              <Image
                src="/images/about.jpg"
                alt="Crisbo tatuando en su estudio"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover grayscale-[10%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/30 via-transparent to-transparent" />
            </div>

            {/* Stats overlay */}
            <div className="absolute -bottom-6 -right-4 md:right-8 bg-bg-secondary border border-line p-6 md:p-8">
              <p className="font-display text-5xl md:text-6xl text-ink">9+</p>
              <p className="label mt-2">ANOS TATUANDO</p>
            </div>
          </div>

          {/* Right - Content */}
          <div className="lg:pt-12">
            <h2 className="reveal delay-2 font-display text-section uppercase leading-[0.9]">
              MAS QUE<br />
              <span className="text-ink-muted">TATUAJES.</span>
            </h2>

            <div className="reveal delay-3 mt-8 md:mt-12 space-y-6">
              <p className="text-xl md:text-2xl font-medium text-ink leading-snug">
                Soy Crisbo.
              </p>
              <p className="text-ink-muted leading-relaxed">
                Mi trabajo parte de una idea simple: un tatuaje no deberia sentirse
                como imagenes pegadas sobre la piel.
              </p>
              <p className="text-ink-muted leading-relaxed">
                Cada proyecto se disena pensando en composicion, anatomia, contraste
                y narrativa para que todas las piezas funcionen como una sola obra.
              </p>
            </div>

            {/* Editorial Data Blocks */}
            <div className="reveal delay-4 mt-12 grid grid-cols-2 gap-6">
              <div className="border-l border-line pl-4">
                <p className="font-display text-2xl md:text-3xl text-ink">BOGOTA</p>
                <p className="label mt-1">COLOMBIA</p>
              </div>
              <div className="border-l border-line pl-4">
                <p className="font-display text-2xl md:text-3xl text-ink">BLACK & GREY</p>
                <p className="label mt-1">REALISM</p>
              </div>
              <div className="border-l border-line pl-4">
                <p className="font-display text-2xl md:text-3xl text-ink">CUSTOM</p>
                <p className="label mt-1">PROJECTS</p>
              </div>
              <div className="border-l border-line pl-4">
                <p className="font-display text-2xl md:text-3xl text-ink">+500</p>
                <p className="label mt-1">PROYECTOS</p>
              </div>
            </div>

            {/* CTA */}
            <a
              href="#estudio"
              className="reveal delay-4 inline-flex items-center gap-2 mt-12 text-sm tracking-wider text-ink hover:text-sage transition-colors group"
            >
              CONOCE MI HISTORIA
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
