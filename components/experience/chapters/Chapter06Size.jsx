"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star6, WavyLine } from "@/components/ui/EditorialDoodles";

const sizes = [
  { id: "pequeno", title: "PEQUEÑO", range: "5 – 10 CM", visual: "w-6 h-6" },
  { id: "mediano", title: "MEDIANO", range: "10 – 20 CM", visual: "w-10 h-10" },
  { id: "grande", title: "GRANDE", range: "20 – 30 CM", visual: "w-14 h-14" },
  { id: "proyecto", title: "PROYECTO GRANDE", range: "30+ CM", visual: "w-18 h-18" },
  { id: "manga", title: "MANGA / PROYECTO ABIERTO", range: "A definir", visual: "w-20 h-6" },
];

export default function Chapter06Size() {
  const { state, dispatch, nextChapter } = useExperience();
  const { size } = state;

  const selectSize = (id) => {
    dispatch({ type: "SET_SIZE", payload: id });
  };

  const canContinue = !!size;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background word */}
      <div className="absolute bottom-1/3 -right-4 font-gothic text-[90px] text-cream/[0.03] leading-none select-none pointer-events-none">
        SIZE
      </div>

      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">06 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">¿QUÉ TAN</span>
          <span className="word-reveal block text-gold stagger-1">GRANDE</span>
          <span className="word-reveal block stagger-2">LO IMAGINAS?</span>
        </h1>
        <Star6 className="absolute -right-2 top-4" size={28} color="gold" />
      </div>

      {/* Subtitle */}
      <p className="mt-4 text-muted text-sm animate-fade-up stagger-2">
        El tamaño define la complejidad y el tiempo de trabajo.
      </p>

      {/* Size options - Editorial cards */}
      <div className="mt-6 space-y-3">
        {sizes.map((s, i) => {
          const isSelected = size === s.id;

          return (
            <button
              key={s.id}
              onClick={() => selectSize(s.id)}
              className={`w-full flex items-center gap-4 p-4 text-left transition-all animate-fade-up torn-paper ${
                isSelected
                  ? "bg-gold/15 border-2 border-gold"
                  : "bg-surface border border-line hover:border-line-light"
              }`}
              style={{ animationDelay: `${0.2 + i * 0.08}s` }}
            >
              {/* Visual size indicator */}
              <div className="flex-shrink-0 flex items-center justify-center w-16">
                <div
                  className={`${s.visual} rounded transition-colors ${
                    isSelected ? "bg-gold/40 border-2 border-gold" : "bg-surface-light border border-line"
                  }`}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-display text-base ${isSelected ? "text-gold" : "text-cream"}`}>
                  {s.title}
                </p>
                <p className="text-muted text-xs mt-0.5">{s.range}</p>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-bg">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Decorative wavy line */}
      <div className="mt-6 flex justify-center animate-fade-up stagger-5">
        <WavyLine width={100} color="gold" />
      </div>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end">
        <button
          onClick={nextChapter}
          className={`btn-primary ${!canContinue ? "opacity-50 pointer-events-none" : ""}`}
          disabled={!canContinue}
        >
          CONTINUAR
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
