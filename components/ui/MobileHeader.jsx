"use client";

import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import ProgressBar from "./ProgressBar";

export default function MobileHeader({ showProgress = false }) {
  const { state, dispatch, goToScreen } = useExperience();
  const { currentScreen, menuOpen, soundEnabled } = state;

  const showQuoteProgress = currentScreen === "quote" && showProgress;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-line">
      <div className="flex items-center justify-between h-14 px-5">
        {/* Logo / Back */}
        <button
          onClick={() => goToScreen("home")}
          className="font-display text-xl text-ink"
          aria-label="Ir al inicio"
        >
          CRISBO
        </button>

        {/* Progress (solo en flujo de cotización) */}
        {showQuoteProgress && (
          <ProgressBar className="absolute left-1/2 -translate-x-1/2" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={() => dispatch({ type: "TOGGLE_SOUND" })}
            className="w-10 h-10 flex items-center justify-center text-muted"
            aria-label={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Menu toggle */}
          <button
            onClick={() => dispatch({ type: "TOGGLE_MENU" })}
            className="w-10 h-10 flex items-center justify-center text-ink"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
