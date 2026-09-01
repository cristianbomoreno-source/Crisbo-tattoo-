"use client";

import { useState } from "react";
import { ArrowRight, Plus, X, Image as ImageIcon } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

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
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">08 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-section"
        lines={[
          { text: "RESUMEN DE" },
          { text: "TU PROYECTO.", gold: true },
        ]}
      />

      {/* Mission Summary Card */}
      <div className="mt-6 bg-surface border border-line rounded-lg p-5 animate-fade-in stagger-2">
        <p className="label-gold mb-4">MISSION SUMMARY</p>

        <div className="space-y-4">
          {/* Idea */}
          <div>
            <p className="text-xs text-cement uppercase tracking-wider">IDEA</p>
            <p className="text-ink mt-1">{intentionLabels[intention] || "No seleccionada"}</p>
          </div>

          {/* Zone */}
          <div>
            <p className="text-xs text-cement uppercase tracking-wider">ZONA</p>
            <p className="text-ink mt-1">{bodyLabels[bodyZone] || "No seleccionada"}</p>
          </div>

          {/* Size */}
          <div>
            <p className="text-xs text-cement uppercase tracking-wider">TAMAÑO</p>
            <p className="text-ink mt-1">{sizeLabels[size] || "No seleccionado"}</p>
          </div>

          {/* Styles */}
          <div>
            <p className="text-xs text-cement uppercase tracking-wider">ESTILO</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {styles.length > 0 ? (
                styles.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 bg-gold/20 text-gold text-xs rounded"
                  >
                    {s.toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="text-muted">No seleccionado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name input (si no lo tenemos) */}
      {showNameInput && (
        <div className="mt-6 animate-fade-in stagger-3">
          <p className="text-ink font-medium mb-2">ANTES DE CONTINUAR...</p>
          <p className="text-muted text-sm mb-4">¿Cómo te llamas?</p>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Tu nombre"
            className="input-field"
            autoComplete="name"
          />
        </div>
      )}

      {/* Description */}
      <div className="mt-6 animate-fade-in stagger-4">
        <p className="text-ink font-medium mb-2">CUÉNTAME TU IDEA CON TUS PALABRAS</p>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Cuéntame qué quieres representar, qué elementos imaginas o qué historia hay detrás..."
          className="textarea-field"
          rows={4}
        />
      </div>

      {/* Add references button */}
      <button className="mt-4 flex items-center gap-2 text-gold text-sm animate-fade-in stagger-5">
        <Plus size={16} />
        AÑADIR REFERENCIAS
      </button>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end">
        <button
          onClick={nextChapter}
          className={`btn-primary ${!canContinue ? "opacity-50 pointer-events-none" : ""}`}
          disabled={!canContinue}
        >
          FINALIZAR
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}
