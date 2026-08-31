"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, ArrowDown } from "lucide-react";

export default function Hero() {
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
      id="inicio"
      className="relative min-h-[100svh] flex flex-col bg-bg grain overflow-hidden"
    >
      {/* Top Editorial Data */}
      <div className="relative z-10 pt-24 md:pt-28 px-5 md:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex justify-between items-start">
          {/* Left */}
          <div className="reveal space-y-1">
            <p className="label">TATTOO ARTIST</p>
            <p className="label">BLACK & GREY / REALISM</p>
          </div>
          {/* Right */}
          <div className="reveal delay-1 text-right space-y-1 hidden sm:block">
            <p className="label">BOGOTA, CO</p>
            <p className="label">COLINA CAMPESTRE</p>
          </div>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex items-center px-5 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-[1fr_45%] gap-8 lg:gap-12 items-center">
          {/* Left - Typography */}
          <div className="order-2 lg:order-1">
            {/* Main Title */}
            <div className="reveal delay-1 relative">
              <h1 className="font-display text-hero uppercase leading-[0.85] tracking-tight">
                CRISBO
              </h1>
              <p className="font-display text-hero-sub uppercase text-ink-muted leading-[0.9] -mt-2 md:-mt-4">
                TATTOO<br className="sm:hidden" /> ARTIST
              </p>
            </div>

            {/* Tagline */}
            <div className="reveal delay-2 mt-8 md:mt-12 max-w-md">
              <p className="text-lg md:text-xl font-medium leading-snug text-ink">
                NO SOLO TATUO PIEZAS.<br />
                CONSTRUYO PROYECTOS QUE CUENTAN HISTORIAS.
              </p>
              <p className="mt-4 text-ink-muted text-sm md:text-base leading-relaxed">
                Diseno tatuajes personalizados pensados para adaptarse al cuerpo,
                mantener una composicion solida y seguir teniendo fuerza con el paso del tiempo.
              </p>
            </div>

            {/* CTAs */}
            <div className="reveal delay-3 mt-8 md:mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/573202107769"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-sage text-bg text-sm font-medium tracking-wider px-8 py-4 hover:bg-sage-dark transition-colors"
              >
                COTIZA TU PROYECTO
                <ArrowRight size={16} />
              </a>
              <a
                href="#trabajos"
                className="inline-flex items-center justify-center gap-2 border border-line text-ink text-sm tracking-wider px-8 py-4 hover:border-ink-muted transition-colors"
              >
                VER MI TRABAJO
                <ArrowDown size={16} />
              </a>
            </div>
          </div>

          {/* Right - Photo */}
          <div className="order-1 lg:order-2 relative">
            <div className="reveal relative aspect-[3/4] max-h-[70vh] lg:max-h-[75vh] mx-auto lg:mx-0">
              {/* Background name effect */}
              <div className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 font-display text-[120px] md:text-[200px] lg:text-[280px] text-ink/[0.03] leading-none select-none pointer-events-none -z-10 whitespace-nowrap">
                CRISBO
              </div>

              {/* Photo Container */}
              <div className="relative h-full w-full overflow-hidden">
                {/* PLACEHOLDER: Reemplazar con foto profesional de Crisbo */}
                <Image
                  src="/images/hero-tattoo.jpg"
                  alt="Crisbo - Tattoo Artist en Bogota"
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center grayscale-[20%] contrast-[1.05]"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDBAURAAYSIRMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAABAgMRIf/aAAwDAQACEQMRAD8A2G43C4W69RQU1PDJSyQGRneQ8lYNjAHXo6lXG/X2GOWOkt1vYSRtGS80nqt/NKUqptIqb4f/2Q=="
                />

                {/* Dark overlay for integration */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg/40 via-transparent to-transparent lg:from-bg/60" />
              </div>

              {/* Editorial Badge */}
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-20 h-20 md:w-24 md:h-24 rounded-full border border-ink/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[8px] md:text-[9px] tracking-[0.2em] text-ink-muted uppercase">Custom</p>
                  <p className="text-[8px] md:text-[9px] tracking-[0.2em] text-ink-muted uppercase">Tattoo</p>
                  <p className="text-[10px] md:text-xs font-display text-ink mt-0.5">BOGOTA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Editorial Data */}
      <div className="relative z-10 pb-8 px-5 md:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex justify-between items-end">
          <div className="reveal delay-4">
            <p className="label">AGENDA ABIERTA</p>
            <p className="font-display text-2xl md:text-3xl text-ink">2026</p>
          </div>
          <div className="reveal delay-4 hidden md:block">
            <p className="label text-right">+9 ANOS DE EXPERIENCIA</p>
          </div>
        </div>
      </div>
    </section>
  );
}
