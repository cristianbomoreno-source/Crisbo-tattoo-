"use client";

import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";
import SelectionCard from "@/components/ui/SelectionCard";

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
      {/* Background text */}
      <div className="bg-text top-1/3 -left-10">BODY</div>

      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">05 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "¿DÓNDE EN TU" },
          { text: "CUERPO?", gold: true },
        ]}
      />

      {/* Body Map SVG */}
      <div className="mt-6 flex justify-center animate-fade-in stagger-2">
        <svg
          viewBox="0 0 200 300"
          className="w-40 h-60"
          aria-label="Mapa del cuerpo"
        >
          {/* Silueta simplificada */}
          <ellipse cx="100" cy="30" rx="25" ry="28" className="body-map-zone" />
          <rect x="75" y="58" width="50" height="80" rx="10" className={`body-map-zone ${bodyZone === "pecho" || bodyZone === "espalda" ? "active" : ""}`} />

          {/* Brazos */}
          <rect x="30" y="65" width="45" height="25" rx="10" className={`body-map-zone ${bodyZone === "brazo" ? "active" : ""}`} />
          <rect x="125" y="65" width="45" height="25" rx="10" className={`body-map-zone ${bodyZone === "brazo" ? "active" : ""}`} />

          {/* Antebrazos */}
          <rect x="15" y="92" width="35" height="45" rx="8" className={`body-map-zone ${bodyZone === "antebrazo" ? "active" : ""}`} />
          <rect x="150" y="92" width="35" height="45" rx="8" className={`body-map-zone ${bodyZone === "antebrazo" ? "active" : ""}`} />

          {/* Piernas */}
          <rect x="70" y="142" width="25" height="85" rx="8" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
          <rect x="105" y="142" width="25" height="85" rx="8" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />

          {/* Piernas bajas */}
          <rect x="68" y="230" width="25" height="60" rx="8" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
          <rect x="107" y="230" width="25" height="60" rx="8" className={`body-map-zone ${bodyZone === "pierna" ? "active" : ""}`} />
        </svg>
      </div>

      {/* Options */}
      <div className="mt-6 space-y-3">
        {bodyZones.map((zone, i) => (
          <div
            key={zone.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${0.3 + i * 0.06}s` }}
          >
            <SelectionCard
              selected={bodyZone === zone.id}
              onClick={() => selectZone(zone.id)}
              title={zone.title}
              description={zone.description}
            />
          </div>
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
