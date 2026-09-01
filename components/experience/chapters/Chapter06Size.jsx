"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

const sizes = [
  { id: "pequeno", title: "PEQUEÑO", range: "5 – 10 CM", visual: "w-8 h-8" },
  { id: "mediano", title: "MEDIANO", range: "10 – 20 CM", visual: "w-12 h-12" },
  { id: "grande", title: "GRANDE", range: "20 – 30 CM", visual: "w-16 h-16" },
  { id: "proyecto", title: "PROYECTO GRANDE", range: "30+ CM", visual: "w-20 h-20" },
  { id: "manga", title: "MANGA / PROYECTO ABIERTO", range: "A definir", visual: "w-24 h-8" },
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
      {/* Background text */}
      <div className="bg-text bottom-1/3 right-0">SIZE</div>

      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">06 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "¿QUÉ TAN" },
          { text: "GRANDE", gold: true },
          { text: "LO IMAGINAS?" },
        ]}
      />

      {/* Size options */}
      <div className="mt-8 space-y-3">
        {sizes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => selectSize(s.id)}
            className={`w-full flex items-center gap-4 p-4 bg-surface border rounded-lg text-left transition-all animate-fade-in-up ${
              size === s.id
                ? "border-gold bg-gold-muted"
                : "border-line hover:border-line-light"
            }`}
            style={{ animationDelay: `${0.2 + i * 0.08}s` }}
          >
            {/* Visual size indicator */}
            <div className="flex-shrink-0 flex items-center justify-center w-20">
              <div
                className={`${s.visual} rounded border-2 transition-colors ${
                  size === s.id ? "border-gold bg-gold/20" : "border-line-light"
                }`}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`font-display text-lg ${size === s.id ? "text-gold" : "text-ink"}`}>
                {s.title}
              </p>
              <p className="text-muted text-xs mt-0.5">{s.range}</p>
            </div>

            {/* Selection indicator */}
            {size === s.id && (
              <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center animate-check">
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-bg">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end">
        <button
          onClick={nextChapter}
          className={`btn-primary ${!canContinue ? "opacity-50 pointer-events-none" : ""}`}
          disabled={!canContinue}
        >
          CONTINUAR
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}
