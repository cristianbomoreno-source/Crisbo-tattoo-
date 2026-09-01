"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Crown, Smiley, Star4, WavyLine } from "@/components/ui/EditorialDoodles";

export default function Chapter02Philosophy() {
  const { nextChapter, goToChapter } = useExperience();

  const principles = ["IDEA.", "HISTORIA.", "COMPOSICIÓN.", "PROPÓSITO."];

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background word */}
      <div className="absolute top-1/3 -left-12 font-gothic text-[70px] text-cream/[0.03] leading-none select-none pointer-events-none -rotate-12">
        PROJECT
      </div>

      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">02 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">MI</span>
          <span className="word-reveal block text-gold stagger-2">FILOSOFÍA.</span>
        </h1>
        <Star4 className="absolute -right-1 top-2" size={24} />
      </div>

      {/* Main quote */}
      <div className="mt-10 relative animate-fade-up stagger-3">
        <Crown className="absolute -top-8 -left-2" size={40} color="gold" />

        <div className="bg-surface border-l-4 border-gold p-5 torn-paper">
          <blockquote className="font-display text-xl text-cream leading-tight">
            "EL TATUAJE EMPIEZA ANTES DE LA AGUJA."
          </blockquote>
          <WavyLine className="mt-3" width={80} color="gold" />
        </div>
      </div>

      {/* Principles */}
      <div className="mt-10 space-y-3 animate-fade-up stagger-4">
        <p className="label text-muted mb-4">TODO PROYECTO EMPIEZA CON:</p>
        {principles.map((principle, i) => (
          <div
            key={principle}
            className="flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${0.5 + i * 0.1}s` }}
          >
            <span className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-display text-sm">
              {i + 1}
            </span>
            <span className="font-gothic text-2xl text-gold">
              {principle}
            </span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mt-10 relative animate-fade-up stagger-5">
        <p className="text-muted leading-relaxed">
          Cada pieza es única. No se trata de copiar, sino de crear algo que tenga sentido para ti hoy y siempre.
        </p>
        <Smiley className="absolute -bottom-2 right-4" size={32} color="teal" />
      </div>

      {/* Sticker */}
      <div className="sticker sticker-teal absolute right-4 top-[55%] stagger-6">
        UNIQUE
      </div>

      {/* Actions */}
      <div className="mt-auto pt-8 flex items-center justify-between animate-fade-up stagger-6">
        <button
          onClick={() => goToChapter(4, false)}
          className="btn-ghost"
        >
          OMITIR INTRO
        </button>

        <button
          onClick={nextChapter}
          className="btn-primary"
        >
          CONTINUAR
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
