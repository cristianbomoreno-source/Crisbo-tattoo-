"use client";

import { Menu, X } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import ProgressBar from "./ProgressBar";
import { Star4 } from "@/components/ui/EditorialDoodles";

export default function MobileHeader({ showProgress = false }) {
  const { state, dispatch, goToScreen } = useExperience();
  const { currentScreen, menuOpen } = state;

  const showQuoteProgress = currentScreen === "quote" && showProgress;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-line">
      <div className="flex items-center justify-between h-14 px-5">
        {/* Logo - Gothic */}
        <button
          onClick={() => goToScreen("home")}
          className="relative font-gothic text-xl text-cream hover:text-gold transition-colors"
          aria-label="Ir al inicio"
        >
          CRISBO
          <Star4
            className="absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            size={12}
            animate={false}
          />
        </button>

        {/* Progress (solo en flujo de cotización) */}
        {showQuoteProgress && (
          <ProgressBar className="absolute left-1/2 -translate-x-1/2" />
        )}

        {/* Menu toggle */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_MENU" })}
          className="w-11 h-11 flex items-center justify-center text-cream hover:text-gold transition-colors"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
