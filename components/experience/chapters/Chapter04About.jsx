"use client";

import { ArrowRight, Heart, Repeat, Compass, Star, Sparkles, HelpCircle } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Smiley, Lightning } from "@/components/ui/EditorialDoodles";

const intentions = [
  { id: "recuerdo", title: "UN RECUERDO", icon: Heart, color: "gold" },
  { id: "transformacion", title: "UNA TRANSFORMACIÓN", icon: Repeat, color: "teal" },
  { id: "creencia", title: "UNA CREENCIA", icon: Compass, color: "gold" },
  { id: "simbolo", title: "UN SÍMBOLO", icon: Star, color: "teal" },
  { id: "algo-nuevo", title: "ALGO NUEVO", icon: Sparkles, color: "gold" },
  { id: "no-se", title: "AÚN NO LO SÉ", icon: HelpCircle, color: "cream" },
];

export default function Chapter04About() {
  const { state, dispatch, nextChapter } = useExperience();
  const { intention } = state;

  const selectIntention = (id) => {
    dispatch({ type: "SET_INTENTION", payload: id });
  };

  const canContinue = !!intention;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background word */}
      <div className="absolute bottom-1/4 -right-8 font-gothic text-[70px] text-cream/[0.03] leading-none select-none pointer-events-none -rotate-3">
        STORY
      </div>

      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">04 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
        <Lightning size={20} color="gold" animate={false} />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">AHORA</span>
          <span className="word-reveal block stagger-1">HABLEMOS</span>
          <span className="word-reveal block text-gold stagger-2">DE TI.</span>
        </h1>
        <Star4 className="absolute -right-1 top-6" size={24} />
      </div>

      {/* Question */}
      <p className="mt-6 label text-muted animate-fade-up stagger-2">
        ¿QUÉ QUIERES EXPRESAR?
      </p>

      {/* Options Grid - Editorial cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {intentions.map((item, i) => {
          const isSelected = intention === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => selectIntention(item.id)}
              className={`relative p-4 text-left transition-all animate-fade-up torn-paper ${
                isSelected
                  ? item.color === "teal"
                    ? "bg-teal/20 border-2 border-teal"
                    : "bg-gold/20 border-2 border-gold"
                  : "bg-surface border border-line hover:border-line-light"
              }`}
              style={{ animationDelay: `${0.2 + i * 0.08}s` }}
            >
              <Icon
                size={20}
                className={isSelected ? (item.color === "teal" ? "text-teal" : "text-gold") : "text-muted"}
              />
              <p className={`font-display text-sm mt-2 ${
                isSelected ? "text-cream" : "text-muted"
              }`}>
                {item.title}
              </p>

              {isSelected && (
                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                  item.color === "teal" ? "bg-teal" : "bg-gold"
                }`}>
                  <svg width="10" height="10" viewBox="0 0 12 12" className="text-bg">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Note with doodle */}
      <div className="mt-8 flex items-center gap-3 animate-fade-up stagger-5">
        <Smiley size={28} color="teal" />
        <p className="text-muted text-sm italic">
          No hay ideas malas. Solo puntos de partida.
        </p>
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
