"use client";

import { useState } from "react";
import { ArrowRight, Plus, ImageIcon } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Crown, WavyLine } from "@/components/ui/EditorialDoodles";

const intentionLabels = {
  recuerdo: "Un recuerdo",
  transformacion: "Una transformación",
  creencia: "Una creencia",
  simbolo: "Un símbolo",
  "algo-nuevo": "Algo nuevo",
  "no-se": "Aún no lo sé",
};

const sizeLabels = {
  pequeno: "Pequeño (5-10 cm)",
  mediano: "Mediano (10-20 cm)",
  grande: "Grande (20-30 cm)",
  proyecto: "Proyecto Grande (30+ cm)",
  manga: "Manga / Proyecto Abierto",
};

const bodyLabels = {
  brazo: "Brazo",
  antebrazo: "Antebrazo",
  pecho: "Pecho",
  espalda: "Espalda",
  pierna: "Pierna",
  otra: "Otra zona",
};

export default function Chapter08Summary() {
  const { state, dispatch, nextChapter } = useExperience();
  const { intention, bodyZone, size, styles, description, name } = state;
  const [showNameInput, setShowNameInput] = useState(!name);

  const handleDescriptionChange = (e) => {
    dispatch({ type: "SET_DESCRIPTION", payload: e.target.value });
  };

  const handleNameChange = (e) => {
    dispatch({ type: "SET_NAME", payload: e.target.value });
  };

  const canContinue = !!name && name.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">08 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
        <Crown size={20} color="gold" animate={false} />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-sm text-cream leading-[0.85]">
          <span className="word-reveal block">RESUMEN DE</span>
          <span className="word-reveal block text-gold stagger-2">TU PROYECTO.</span>
        </h1>
        <Star4 className="absolute -right-1 top-0" size={20} />
      </div>

      {/* Mission Summary Card - Editorial style */}
      <div className="mt-6 bg-surface border-l-4 border-gold p-5 torn-paper animate-fade-up stagger-2">
        <p className="label-gold mb-4 flex items-center gap-2">
          MISSION SUMMARY
          <WavyLine width={40} color="gold" />
        </p>

        <div className="space-y-4">
          {/* Grid layout for summary */}
          <div className="grid grid-cols-2 gap-4">
            {/* Idea */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">IDEA</p>
              <p className="text-cream text-sm mt-1 font-display">{intentionLabels[intention] || "—"}</p>
            </div>

            {/* Zone */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">ZONA</p>
              <p className="text-cream text-sm mt-1 font-display">{bodyLabels[bodyZone] || "—"}</p>
            </div>

            {/* Size */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">TAMAÑO</p>
              <p className="text-cream text-sm mt-1 font-display">{sizeLabels[size] || "—"}</p>
            </div>

            {/* Styles */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">ESTILO</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {styles.length > 0 ? (
                  styles.map((s, i) => (
                    <span
                      key={s}
                      className={`sticker ${i % 2 === 0 ? "" : "sticker-teal"} text-[8px]`}
                    >
                      {s.toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="text-muted text-sm">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Name input */}
      {showNameInput && (
        <div className="mt-6 animate-fade-up stagger-3">
          <p className="font-display text-lg text-cream mb-2">ANTES DE CONTINUAR...</p>
          <p className="text-muted text-sm mb-4">¿Cómo te llamas?</p>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Tu nombre"
            className="w-full bg-surface border-2 border-line focus:border-gold rounded-none px-4 py-3 text-cream placeholder:text-cement outline-none transition-colors"
            autoComplete="name"
          />
        </div>
      )}

      {/* Description */}
      <div className="mt-6 animate-fade-up stagger-4">
        <p className="font-display text-base text-cream mb-2">CUÉNTAME TU IDEA</p>
        <p className="text-muted text-xs mb-3">Con tus palabras, sin filtros.</p>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Qué quieres representar, qué elementos imaginas, qué historia hay detrás..."
          className="w-full bg-surface border-2 border-line focus:border-gold rounded-none px-4 py-3 text-cream placeholder:text-cement outline-none transition-colors resize-none"
          rows={4}
        />
      </div>

      {/* Add references button */}
      <button className="mt-4 flex items-center gap-2 text-teal text-sm animate-fade-up stagger-5 hover:text-teal-light transition-colors">
        <ImageIcon size={16} />
        AÑADIR REFERENCIAS (OPCIONAL)
      </button>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end">
        <button
          onClick={nextChapter}
          className={`btn-primary ${!canContinue ? "opacity-50 pointer-events-none" : ""}`}
          disabled={!canContinue}
        >
          FINALIZAR
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
