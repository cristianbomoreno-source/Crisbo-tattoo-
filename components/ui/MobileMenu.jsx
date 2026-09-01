"use client";

import { useExperience } from "@/context/ExperienceContext";
import { Instagram, MessageCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Star4, Star6, Splash, WavyLine } from "@/components/ui/EditorialDoodles";

const menuItems = [
  { label: "INICIO", screen: "home", accent: false },
  { label: "COTIZAR MI TATUAJE", screen: "quote", accent: true },
  { label: "PORTAFOLIO", screen: "portfolio", accent: false },
  { label: "REDES / CONTACTO", screen: "social", accent: false },
];

export default function MobileMenu() {
  const { state, goToScreen, resetExperience } = useExperience();
  const { menuOpen, currentScreen } = state;

  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-bg/98 pt-14 px-5 pb-8 overflow-y-auto grain">
      {/* Background decorations */}
      <div className="absolute top-20 -right-8 opacity-50">
        <Splash size={120} color="gold" />
      </div>
      <div className="absolute bottom-1/4 -left-8 opacity-30">
        <Splash size={100} color="teal" />
      </div>

      {/* Doodles */}
      <Star4 className="absolute top-28 right-12" size={24} />
      <Star6 className="absolute bottom-32 left-8" size={20} color="teal" />

      {/* Navigation */}
      <nav className="mt-8 mb-12">
        {menuItems.map((item, i) => {
          const isActive = currentScreen === item.screen;

          return (
            <button
              key={item.screen}
              onClick={() => goToScreen(item.screen)}
              className={`w-full text-left py-4 border-b border-line flex items-center justify-between animate-fade-up group`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span
                className={`font-gothic text-2xl transition-colors ${
                  isActive
                    ? "text-gold"
                    : item.accent
                    ? "text-gold"
                    : "text-cream group-hover:text-gold"
                }`}
              >
                {item.label}
              </span>
              <ArrowRight
                size={20}
                className={`transition-all ${
                  isActive ? "text-gold" : "text-muted group-hover:text-gold group-hover:translate-x-1"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Sticker */}
      <div className="sticker absolute right-8 top-[35%]">
        MENU
      </div>

      {/* Social Links */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <p className="label-gold mb-4 flex items-center gap-2">
          SÍGUEME
          <WavyLine width={40} color="gold" />
        </p>
        <a
          href="https://instagram.com/crisbotattoo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-3 bg-surface border-l-4 border-gold text-cream hover:bg-gold/10 transition-colors torn-paper"
        >
          <Instagram size={20} className="text-gold" />
          <span className="font-display text-sm">INSTAGRAM</span>
        </a>
        <a
          href="https://wa.me/573202107769"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-3 bg-surface border-l-4 border-teal text-cream hover:bg-teal/10 transition-colors torn-paper"
        >
          <MessageCircle size={20} className="text-teal" />
          <span className="font-display text-sm">WHATSAPP</span>
        </a>
      </div>

      {/* Location */}
      <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <p className="label-gold mb-3">UBICACIÓN</p>
        <p className="font-display text-lg text-cream">COLINA CAMPESTRE</p>
        <p className="text-muted text-sm">Bogotá, Colombia</p>
      </div>

      {/* Reset */}
      <button
        onClick={resetExperience}
        className="mt-10 flex items-center gap-2 text-cement text-xs tracking-wider hover:text-muted transition-colors animate-fade-up"
        style={{ animationDelay: "0.6s" }}
      >
        <RotateCcw size={14} />
        REINICIAR EXPERIENCIA
      </button>

      {/* Background word */}
      <div className="absolute bottom-16 -right-4 font-gothic text-[80px] text-cream/[0.02] select-none pointer-events-none -rotate-6">
        CRISBO
      </div>
    </div>
  );
}
