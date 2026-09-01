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
        <div className="max-w-container mx-auto flex justify-between items-start">
          <div className="reveal space-y-1">
            <p className="label">TATTOO ARTIST</p>
            <p className="label">BLACK & GREY / REALISM</p>
          </div>
          <div className="reveal delay-1 text-right space-y-1 hidden sm:block">
            <p className="label">BOGOTÁ, CO</p>
            <p className="label">COLINA CAMPESTRE</p>
          </div>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex items-center px-5 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="max-w-container mx-auto w-full grid lg:grid-cols-[1fr_42%] gap-8 lg:gap-16 items-center">
          {/* Left - Typography */}
          <div className="order-2 lg:order-1">
            {/* Main Title */}
            <div className="reveal delay-1 relative">
              <h1 className="font-display text-hero uppercase">
                CRISBO
              </h1>
              <p className="font-display text-hero-sub uppercase text-muted -mt-1 md:-mt-3">
                TATTOO<br className="sm:hidden" /> ARTIST
              </p>
            </div>

            {/* Tagline */}
            <div className="reveal delay-2 mt-10 md:mt-14 max-w-prose">
              <p className="text-xl md:text-2xl font-medium leading-snug text-ink">
                NO SOLO TATÚO PIEZAS.<br />
                CONSTRUYO PROYECTOS QUE CUENTAN HISTORIAS.
              </p>
              <p className="mt-5 text-muted text-base leading-relaxed max-w-md">
                Diseño tatuajes personalizados pensados para adaptarse al cuerpo,
                mantener una composición sólida y seguir teniendo fuerza con el paso del tiempo.
              </p>
            </div>

            {/* CTAs */}
            <div className="reveal delay-3 mt-10 md:mt-12 flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/573202107769"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gold text-bg text-sm font-medium tracking-wider px-8 py-4 hover:bg-gold-dark transition-colors duration-200"
              >
                COTIZA TU PROYECTO
                <ArrowRight size={16} />
              </a>
              <a
                href="#trabajos"
                className="inline-flex items-center justify-center gap-2 border border-line text-ink text-sm tracking-wider px-8 py-4 hover:border-muted transition-colors duration-200"
              >
                VER MI TRABAJO
                <ArrowDown size={16} />
              </a>
            </div>
          </div>

          {/* Right - Photo */}
          <div className="order-1 lg:order-2 relative">
            <div className="reveal relative aspect-[3/4] max-h-[65vh] lg:max-h-[72vh] mx-auto lg:mx-0">
              {/* Background name effect */}
              <div className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 font-display text-[100px] md:text-[160px] lg:text-[220px] text-ink/[0.025] leading-none select-none pointer-events-none -z-10 whitespace-nowrap">
                CRISBO
              </div>

              {/* Photo Container */}
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src="/images/hero-tattoo.jpg"
                  alt="Crisbo - Tattoo Artist en Bogotá"
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-center editorial-image"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDBAURAAYSIRMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAABAgMRIf/aAAwDAQACEQMRAD8A2G43C4W69RQU1PDJSyQGRneQ8lYNjAHXo6lXG/X2GOWOkt1vYSRtGS80nqt/NKUqptIqb4f/2Q=="
                />

                {/* Overlays for integration */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg/30 via-transparent to-transparent lg:from-bg/50" />
              </div>

              {/* Editorial Badge */}
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-20 h-20 md:w-24 md:h-24 rounded-full border border-ink/15 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[8px] md:text-[9px] tracking-[0.15em] text-cement uppercase">Custom</p>
                  <p className="text-[8px] md:text-[9px] tracking-[0.15em] text-cement uppercase">Tattoo</p>
                  <p className="text-[10px] md:text-xs font-display text-ink mt-0.5">BOGOTÁ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Editorial Data */}
      <div className="relative z-10 pb-8 md:pb-10 px-5 md:px-8 lg:px-12">
        <div className="max-w-container mx-auto flex justify-between items-end">
          <div className="reveal delay-4">
            <p className="label">AGENDA ABIERTA</p>
            <p className="font-display text-2xl md:text-3xl text-ink">2026</p>
          </div>
          <div className="reveal delay-4 hidden md:block">
            <p className="label text-right">+9 AÑOS DE EXPERIENCIA</p>
          </div>
        </div>
      </div>
    </section>
  );
}
