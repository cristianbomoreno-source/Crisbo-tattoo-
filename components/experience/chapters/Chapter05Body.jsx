"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Skull, Asterisk } from "@/components/ui/EditorialDoodles";

const bodyZones = [
  { id: "brazo", title: "BRAZO", description: "Bícep, hombro, deltoides" },
  { id: "antebrazo", title: "ANTEBRAZO", description: "Interior o exterior" },
  { id: "pecho", title: "PECHO", description: "Pectoral o clavícula" },
  { id: "espalda", title: "ESPALDA", description: "Alta, baja o completa" },
  { id: "pierna", title: "PIERNA", description: "Muslo, pantorrilla" },
  { id: "otra", title: "OTRA ZONA", description: "Costillas, mano, etc." },
];

export default function Chapter05Body() {
  const { state, dispatch, nextChapter } = useExperience();
  const { bodyZone } = state;

  const selectZone = (id) => {
    dispatch({ type: "SET_BODY_ZONE", payload: id });
  };

  const canContinue = !!bodyZone;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background word */}
      <div className="absolute top-1/3 -left-10 font-gothic text-[80px] text-cream/[0.03] leading-none select-none pointer-events-none">
        BODY
      </div>

      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">05 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">¿DÓNDE EN</span>
          <span className="word-reveal block text-gold stagger-2">TU CUERPO?</span>
        </h1>
        <Star4 className="absolute -right-1 top-2" size={24} />
      </div>

      {/* Body Map SVG - Editorial style */}
      <div className="mt-6 flex justify-center animate-fade-up stagger-2 relative">
        <div className="absolute -top-4 -right-4">
          <Skull size={36} color="cream" />
        </div>

        <svg
          viewBox="0 0 200 280"
          className="w-36 h-52"
          aria-label="Mapa del cuerpo"
        >
          {/* Silueta simplificada con estilo editorial */}
          <ellipse cx="100" cy="28" rx="22" ry="24" className="body-map-zone" />
          <rect x="78" y="52" width="44" height="70" rx="8" className={`body-map-zone ${bodyZone === "pecho" || bodyZone === "espalda" ? "active" : ""}`} />

          {/* Brazos */}
          <rect x="35" y="58" width="42" height="22" rx="8" className={`body-map-zone ${bodyZone === "brazo" ? "active" : ""}`} />
          <rect x="123" y="58" width="42" height="22" rx="8" className={`body-map-zone ${bodyZone === "brazo" ? "active" : ""}`} />

          {/* Antebrazos */}
          <rect x="20" y="82" width="32" height="40" rx="6" className={`body-map-zone ${bodyZone === "antebrazo" ? "active" : ""}`} />
          <rect x="148" y="82" width="32" height="40" rx="6" className={`body-map-zone ${bodyZone === "antebrazo" ? "active" : ""}`} />

          {/* Piernas */}
          <rect x="72" y="126" width="22" height="75" rx="6" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
          <rect x="106" y="126" width="22" height="75" rx="6" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />

          {/* Piernas bajas */}
          <rect x="70" y="204" width="22" height="55" rx="6" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
          <rect x="108" y="204" width="22" height="55" rx="6" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
        </svg>

        <Asterisk className="absolute -bottom-2 -left-2" size={20} color="gold" />
      </div>

      {/* Options - Editorial style */}
      <div className="mt-6 space-y-2">
        {bodyZones.map((zone, i) => {
          const isSelected = bodyZone === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => selectZone(zone.id)}
              className={`w-full flex items-center gap-4 p-4 text-left transition-all animate-fade-up ${
                isSelected
                  ? "bg-gold/15 border-l-4 border-gold"
                  : "bg-surface border-l-4 border-transparent hover:border-line"
              }`}
              style={{ animationDelay: `${0.3 + i * 0.06}s` }}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-display text-base ${isSelected ? "text-gold" : "text-cream"}`}>
                  {zone.title}
                </p>
                <p className="text-muted text-xs mt-0.5">{zone.description}</p>
              </div>

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
