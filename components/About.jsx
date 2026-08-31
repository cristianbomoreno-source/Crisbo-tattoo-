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
      className="py-section px-5 md:px-8 lg:px-12 bg-bg"
    >
      <div className="max-w-container mx-auto">
        {/* Section Label */}
        <div className="reveal mb-10 md:mb-14">
          <p className="label-accent">01 / THE ARTIST</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left - Photo */}
          <div className="reveal delay-1 relative">
            <div className="aspect-[4/5] relative overflow-hidden">
              <Image
                src="/images/about.jpg"
                alt="Crisbo tatuando en su estudio"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover editorial-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
            </div>

            {/* Stats overlay */}
            <div className="absolute -bottom-6 -right-4 md:right-8 bg-surface border border-line p-6 md:p-8">
              <p className="font-display text-5xl md:text-6xl text-ink">9+</p>
              <p className="label mt-2">AÑOS TATUANDO</p>
            </div>
          </div>

          {/* Right - Content */}
          <div className="lg:pt-12">
            <h2 className="reveal delay-2 font-display text-display-lg uppercase">
              MÁS QUE<br />
              <span className="text-muted">TATUAJES.</span>
            </h2>

            <div className="reveal delay-3 mt-10 md:mt-14 space-y-6 max-w-prose">
              <p className="text-xl md:text-2xl font-medium text-ink leading-snug">
                Soy Crisbo.
              </p>
              <p className="text-muted leading-relaxed">
                Mi trabajo parte de una idea simple: un tatuaje no debería sentirse
                como imágenes pegadas sobre la piel.
              </p>
              <p className="text-muted leading-relaxed">
                Cada proyecto se diseña pensando en composición, anatomía, contraste
                y narrativa para que todas las piezas funcionen como una sola obra.
              </p>
            </div>

            {/* Editorial Data Blocks */}
            <div className="reveal delay-4 mt-14 grid grid-cols-2 gap-8">
              <div className="border-l-2 border-line pl-5">
                <p className="font-display text-2xl md:text-3xl text-ink">BOGOTÁ</p>
                <p className="label mt-1">COLOMBIA</p>
              </div>
              <div className="border-l-2 border-line pl-5">
                <p className="font-display text-2xl md:text-3xl text-ink">BLACK & GREY</p>
                <p className="label mt-1">REALISM</p>
              </div>
              <div className="border-l-2 border-line pl-5">
                <p className="font-display text-2xl md:text-3xl text-ink">CUSTOM</p>
                <p className="label mt-1">PROJECTS</p>
              </div>
              <div className="border-l-2 border-line pl-5">
                <p className="font-display text-2xl md:text-3xl text-ink">+500</p>
                <p className="label mt-1">PROYECTOS</p>
              </div>
            </div>

            {/* CTA */}
            <a
              href="#estudio"
              className="reveal delay-5 inline-flex items-center gap-2 mt-14 text-sm tracking-wider text-ink hover:text-accent transition-colors duration-200 group"
            >
              CONOCE MI HISTORIA
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
