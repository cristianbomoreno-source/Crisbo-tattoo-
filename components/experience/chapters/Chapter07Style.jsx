"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

const styles = [
  {
    id: "blackgrey",
    title: "BLACK & GREY",
    image: "/images/sp-black-grey.jpg",
  },
  {
    id: "realismo",
    title: "REALISMO",
    image: "/images/sp-realismo.jpg",
  },
  {
    id: "narrativo",
    title: "NARRATIVO",
    image: "/images/sp-coverup.jpg",
  },
  {
    id: "blackwork",
    title: "BLACKWORK",
    image: "/images/sp-blackwork.jpg",
  },
  {
    id: "custom",
    title: "CUSTOM COMPOSITION",
    image: "/images/hero-tattoo.jpg",
  },
];

export default function Chapter07Style() {
  const { state, dispatch, nextChapter } = useExperience();
  const { styles: selectedStyles } = state;

  const toggleStyle = (id) => {
    dispatch({ type: "TOGGLE_STYLE", payload: id });
  };

  const canContinue = selectedStyles.length > 0;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">07 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "ELIGE LA" },
          { text: "ENERGÍA", gold: true },
          { text: "DEL PROYECTO." },
        ]}
      />

      <p className="mt-3 text-muted text-sm animate-fade-in stagger-2">
        Puedes seleccionar más de uno.
      </p>

      {/* Style cards */}
      <div className="mt-6 space-y-3 flex-1">
        {styles.map((style, i) => {
          const isSelected = selectedStyles.includes(style.id);

          return (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              className={`w-full relative h-24 rounded-lg overflow-hidden text-left transition-all animate-fade-in-up ${
                isSelected ? "ring-2 ring-gold" : ""
              }`}
              style={{ animationDelay: `${0.2 + i * 0.08}s` }}
            >
              {/* Background image */}
              <Image
                src={style.image}
                alt={style.title}
                fill
                className="object-cover"
              />

              {/* Overlay */}
              <div
                className={`absolute inset-0 transition-colors ${
                  isSelected
                    ? "bg-gold/30"
                    : "bg-bg/60 hover:bg-bg/50"
                }`}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-between px-5">
                <span className="font-display text-xl text-ink">{style.title}</span>

                {/* Check */}
                {isSelected && (
                  <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center animate-check">
                    <Check size={18} className="text-bg" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
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
