"use client";

import { ArrowRight, Heart, Repeat, Compass, Star, Sparkles, HelpCircle } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";
import SelectionCard from "@/components/ui/SelectionCard";
import { Smiley } from "@/components/ui/Doodles";

const intentions = [
  { id: "recuerdo", title: "UN RECUERDO", icon: Heart },
  { id: "transformacion", title: "UNA TRANSFORMACIÓN", icon: Repeat },
  { id: "creencia", title: "UNA CREENCIA", icon: Compass },
  { id: "simbolo", title: "UN SÍMBOLO", icon: Star },
  { id: "algo-nuevo", title: "ALGO NUEVO", icon: Sparkles },
  { id: "no-se", title: "AÚN NO LO SÉ", icon: HelpCircle },
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
      {/* Background text */}
      <div className="bg-text bottom-1/4 right-0 -rotate-3">STORY</div>

      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">04 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "AHORA" },
          { text: "HABLEMOS" },
          { text: "DE TI.", gold: true },
        ]}
      />

      {/* Question */}
      <p className="mt-6 text-muted animate-fade-in stagger-2">
        ¿QUÉ QUIERES EXPRESAR?
      </p>

      {/* Options Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {intentions.map((item, i) => (
          <div
            key={item.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${0.2 + i * 0.08}s` }}
          >
            <SelectionCard
              selected={intention === item.id}
              onClick={() => selectIntention(item.id)}
              icon={item.icon}
              title={item.title}
            />
          </div>
        ))}
      </div>

      {/* Doodle note */}
      <div className="mt-8 flex items-center gap-3 animate-fade-in stagger-5">
        <Smiley size={24} />
        <p className="text-muted text-xs italic">
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
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}
