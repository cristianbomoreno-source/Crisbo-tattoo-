"use client";

import Image from "next/image";
import { ArrowRight, Eye, Users } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star, CurvedArrow } from "@/components/ui/Doodles";

export default function HomeScreen() {
  const { goToScreen, goToChapter } = useExperience();

  const startQuote = () => {
    goToScreen("quote");
    goToChapter(1);
  };

  return (
    <div className="min-h-screen flex flex-col pt-14 pb-8 px-5 grain">
      {/* Background text */}
      <div className="bg-text top-1/4 left-0 -rotate-12">START</div>

      {/* Welcome label */}
      <div className="mt-8 flex items-center gap-3 text-cement animate-fade-in">
        <span className="label">WELCOME</span>
        <span className="w-1 h-1 rounded-full bg-cement" />
        <span className="label">BOGOTÁ</span>
        <span className="w-1 h-1 rounded-full bg-cement" />
        <span className="label">2026</span>
      </div>

      {/* Main Title */}
      <div className="mt-6 relative">
        <h1 className="font-display text-mobile-hero uppercase leading-[0.9]">
          <span className="text-reveal-line block text-ink">¿QUÉ QUIERES</span>
          <span className="text-reveal-line block text-gold stagger-2">HACER HOY?</span>
        </h1>

        {/* Doodle */}
        <Star className="absolute -right-2 top-0 stagger-3" size={28} />
      </div>

      {/* Subtitle */}
      <p className="mt-4 text-muted text-sm animate-fade-in stagger-3">
        ELIGE TU CAMINO
      </p>

      {/* Path Cards */}
      <div className="mt-8 flex-1 flex flex-col gap-4">
        {/* Card 1 - Cotizar (Principal) */}
        <button
          onClick={startQuote}
          className="flex-1 min-h-[180px] relative bg-surface border border-line rounded-lg overflow-hidden text-left group animate-fade-in-up stagger-2"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />

          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            <div>
              <span className="label-number">01</span>
              <h2 className="mt-2 font-display text-mobile-section text-ink leading-[0.95]">
                COTIZAR<br />
                <span className="text-gold">MI TATUAJE</span>
              </h2>
            </div>

            <div className="flex items-end justify-between">
              <p className="text-muted text-xs max-w-[200px]">
                Cuéntame tu idea y construyamos tu proyecto.
              </p>
              <div className="btn-circle flex-shrink-0">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>

          {/* Decorative arrow */}
          <CurvedArrow
            className="absolute top-4 right-4 opacity-30"
            size={40}
            animate={false}
          />
        </button>

        {/* Card 2 - Portafolio */}
        <button
          onClick={() => goToScreen("portfolio")}
          className="flex-[0.6] relative bg-surface border border-line rounded-lg overflow-hidden text-left group animate-fade-in-up stagger-3"
        >
          {/* Image background */}
          <div className="absolute inset-0">
            <Image
              src="/images/sp-black-grey.jpg"
              alt="Portafolio"
              fill
              className="object-cover opacity-40 group-active:opacity-50 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            <span className="label-number">02</span>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">
                  VER<br />PORTAFOLIO
                </h2>
                <p className="text-muted text-xs mt-1">
                  Explora estilos y proyectos.
                </p>
              </div>
              <Eye size={24} className="text-ink/60" />
            </div>
          </div>
        </button>

        {/* Card 3 - Redes */}
        <button
          onClick={() => goToScreen("social")}
          className="flex-[0.5] relative bg-surface border border-line rounded-lg overflow-hidden text-left group animate-fade-in-up stagger-4"
        >
          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            <span className="label-number">03</span>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">
                  REDES /<br />
                  <span className="text-muted">CONOCER MÁS</span>
                </h2>
                <p className="text-muted text-xs mt-1">
                  Contenido e historias.
                </p>
              </div>
              <Users size={24} className="text-ink/60" />
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center animate-fade-in stagger-5">
        <p className="label">CRISBO TATTOO STUDIO</p>
      </div>
    </div>
  );
}
