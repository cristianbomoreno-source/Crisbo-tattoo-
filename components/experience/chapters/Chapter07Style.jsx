"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Lightning } from "@/components/ui/EditorialDoodles";

const styles = [
  {
    id: "blackgrey",
    title: "BLACK & GREY",
    image: "/images/sp-black-grey.jpg",
    accent: "gold",
  },
  {
    id: "realismo",
    title: "REALISMO",
    image: "/images/sp-realismo.jpg",
    accent: "teal",
  },
  {
    id: "narrativo",
    title: "NARRATIVO",
    image: "/images/sp-coverup.jpg",
    accent: "gold",
  },
  {
    id: "blackwork",
    title: "BLACKWORK",
    image: "/images/sp-blackwork.jpg",
    accent: "teal",
  },
  {
    id: "custom",
    title: "CUSTOM COMPOSITION",
    image: "/images/hero-tattoo.jpg",
    accent: "gold",
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
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">07 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
        <Lightning size={18} color="gold" animate={false} />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">ELIGE LA</span>
          <span className="word-reveal block text-gold stagger-1">ENERGÍA</span>
          <span className="word-reveal block stagger-2">DEL PROYECTO.</span>
        </h1>
        <Star4 className="absolute -right-1 top-4" size={24} />
      </div>

      <p className="mt-4 text-muted text-sm animate-fade-up stagger-2">
        Puedes seleccionar más de uno.
      </p>

      {/* Style cards - Editorial photo cards */}
      <div className="mt-6 space-y-3 flex-1">
        {styles.map((style, i) => {
          const isSelected = selectedStyles.includes(style.id);
          const accentColor = style.accent === "teal" ? "teal" : "gold";

          return (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              className={`w-full relative h-20 overflow-hidden text-left transition-all animate-fade-up ${
                isSelected ? `ring-2 ring-${accentColor}` : ""
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
                    ? accentColor === "teal" ? "bg-teal/40" : "bg-gold/40"
                    : "bg-bg/70 hover:bg-bg/60"
                }`}
              />

              {/* Tape decoration when selected */}
              {isSelected && (
                <div className="tape -top-1 right-8 rotate-6" />
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-between px-5">
                <span className={`font-display text-lg ${isSelected ? "text-cream" : "text-cream/80"}`}>
                  {style.title}
                </span>

                {/* Check */}
                {isSelected && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    accentColor === "teal" ? "bg-teal" : "bg-gold"
                  }`}>
                    <Check size={16} className="text-bg" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Sticker for selected */}
              {isSelected && (
                <div className={`sticker ${accentColor === "teal" ? "sticker-teal" : ""} absolute bottom-2 left-4 text-[8px]`}>
                  SELECTED
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected count */}
      {selectedStyles.length > 0 && (
        <p className="mt-4 text-center text-gold text-sm animate-fade-up">
          {selectedStyles.length} estilo{selectedStyles.length > 1 ? "s" : ""} seleccionado{selectedStyles.length > 1 ? "s" : ""}
        </p>
      )}

      {/* Action */}
      <div className="mt-auto pt-6 flex justify-end">
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
