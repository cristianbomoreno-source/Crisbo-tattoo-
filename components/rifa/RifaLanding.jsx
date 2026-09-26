"use client";

import { useState } from "react";
import Image from "next/image";
import TicketSelector from "./TicketSelector";
import MusicPlayer from "./MusicPlayer";

export default function RifaLanding() {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
      {/* Reproductor de música */}
      <MusicPlayer />

      {/* Imagen de fondo completa (ya incluye todo el diseño con las tarjetas) */}
      <div className="relative flex-1">
        <Image
          src="/images/ryan-castro.png"
          alt="Rifa Crisbo Tattoo - Gánate 1 Tatuaje + 1 Boleta Ryan Castro"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Botón Participar y Términos */}
      <div className="bg-bg px-4 py-6">
        {/* Botón Participar */}
        <button
          onClick={() => setShowSelector(true)}
          className="w-full bg-cream text-bg py-4 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          PARTICIPAR
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        {/* Link Términos y Condiciones */}
        <div className="pt-4 text-center">
          <a
            href="/terminos"
            className="text-muted text-xs hover:text-cream transition-colors underline"
          >
            Términos y Condiciones
          </a>
        </div>
      </div>

      {/* Selector de boletas */}
      {showSelector && (
        <TicketSelector onClose={() => setShowSelector(false)} />
      )}
    </div>
  );
}
