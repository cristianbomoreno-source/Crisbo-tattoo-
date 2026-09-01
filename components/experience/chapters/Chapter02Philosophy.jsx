"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";
import { Crown, Smiley } from "@/components/ui/Doodles";

export default function Chapter02Philosophy() {
  const { nextChapter, goToChapter } = useExperience();

  const principles = ["IDEA.", "HISTORIA.", "COMPOSICIÓN.", "PROPÓSITO."];

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background text */}
      <div className="bg-text top-1/3 -left-10 -rotate-6">PROJECT</div>

      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">02 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "MI" },
          { text: "FILOSOFÍA.", gold: true },
        ]}
      />

      {/* Main quote */}
      <div className="mt-10 relative animate-fade-in stagger-3">
        <Crown className="absolute -top-8 -left-2" size={36} />
        <blockquote className="font-display text-2xl text-ink leading-tight">
          "EL TATUAJE EMPIEZA ANTES DE LA AGUJA."
        </blockquote>
      </div>

      {/* Principles */}
      <div className="mt-10 space-y-3 animate-fade-in stagger-4">
        {principles.map((principle, i) => (
          <p
            key={principle}
            className="font-display text-3xl text-gold animate-fade-in-up"
            style={{ animationDelay: `${0.4 + i * 0.1}s` }}
          >
            {principle}
          </p>
        ))}
      </div>

      {/* Description */}
      <div className="mt-10 relative animate-fade-in stagger-5">
        <p className="text-muted leading-relaxed">
          Cada pieza es única. No se trata de copiar, sino de crear algo que tenga sentido para ti hoy y siempre.
        </p>
        <Smiley className="absolute -bottom-6 right-4" size={28} />
      </div>

      {/* Actions */}
      <div className="mt-auto pt-8 flex items-center justify-between animate-fade-in stagger-6">
        <button
          onClick={() => goToChapter(4, false)}
          className="btn-ghost"
        >
          OMITIR
        </button>

        <button
          onClick={nextChapter}
          className="btn-primary"
        >
          CONTINUAR
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}
