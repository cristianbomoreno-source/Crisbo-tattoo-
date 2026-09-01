"use client";

import { useExperience } from "@/context/ExperienceContext";
import { Instagram, MessageCircle, RotateCcw } from "lucide-react";

const menuItems = [
  { label: "INICIO", screen: "home" },
  { label: "COTIZAR MI TATUAJE", screen: "quote" },
  { label: "PORTAFOLIO", screen: "portfolio" },
  { label: "REDES / CONTACTO", screen: "social" },
];

export default function MobileMenu() {
  const { state, goToScreen, resetExperience } = useExperience();
  const { menuOpen, currentScreen } = state;

  if (!menuOpen) return null;

  return (
    <div className="mobile-menu">
      {/* Navigation */}
      <nav className="mb-12">
        {menuItems.map((item, i) => (
          <button
            key={item.screen}
            onClick={() => goToScreen(item.screen)}
            className={`mobile-menu-item w-full text-left stagger-${i + 1} ${
              currentScreen === item.screen ? "text-gold" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Social Links */}
      <div className="space-y-4 opacity-0 animate-fade-in stagger-5">
        <p className="label mb-4">SÍGUEME</p>
        <a
          href="https://instagram.com/crisbotattoo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-muted hover:text-ink transition-colors py-2"
        >
          <Instagram size={20} />
          <span className="text-sm">Instagram</span>
        </a>
        <a
          href="https://wa.me/573202107769"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-muted hover:text-ink transition-colors py-2"
        >
          <MessageCircle size={20} />
          <span className="text-sm">WhatsApp</span>
        </a>
      </div>

      {/* Location */}
      <div className="mt-12 opacity-0 animate-fade-in stagger-6">
        <p className="label mb-2">UBICACIÓN</p>
        <p className="text-muted text-sm">
          Colina Campestre<br />
          Bogotá, Colombia
        </p>
      </div>

      {/* Reset */}
      <button
        onClick={resetExperience}
        className="mt-12 flex items-center gap-2 text-cement text-xs tracking-wider opacity-0 animate-fade-in stagger-7"
      >
        <RotateCcw size={14} />
        REINICIAR EXPERIENCIA
      </button>

      {/* Decorative */}
      <div className="absolute bottom-8 right-5 font-display text-8xl text-ink/[0.02] select-none pointer-events-none">
        CRISBO
      </div>
    </div>
  );
}
