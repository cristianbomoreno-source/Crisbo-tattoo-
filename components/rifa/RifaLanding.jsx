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

      {/* Imagen completa clickeable */}
      <div
        className="relative flex-1 cursor-pointer"
        onClick={() => setShowSelector(true)}
      >
        <Image
          src="/images/ryan-castro.png"
          alt="Rifa Crisbo Tattoo - Gánate 1 Tatuaje + 1 Boleta Ryan Castro"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Link Términos y Condiciones */}
      <div className="bg-bg px-4 py-4 text-center">
        <a
          href="/terminos"
          className="text-muted text-xs hover:text-cream transition-colors underline"
        >
          Términos y Condiciones
        </a>
      </div>

      {/* Selector de boletas */}
      {showSelector && (
        <TicketSelector onClose={() => setShowSelector(false)} />
      )}
    </div>
  );
}
