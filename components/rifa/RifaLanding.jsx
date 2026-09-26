"use client";

import { useState } from "react";
import Image from "next/image";
import TicketSelector from "./TicketSelector";

// Iconos SVG inline
const TattooIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 2L8 6v2l-3 3v4l3 3v4h8v-4l3-3v-4l-3-3V6l-4-4z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
    <path d="M4 14v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
  </svg>
);

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M2 9a3 3 0 0 1 3 3 3 3 0 0 1-3 3v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1-3-3 3 3 0 0 1 3-3V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4z" />
    <path d="M13 5v2m0 4v2m0 4v2" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const NumbersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="12" cy="18" r="3" />
  </svg>
);

const CloverIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 12c-2-2-6-2-6 2s4 4 6 6c2-2 6-2 6-6s-4-4-6-2z" />
    <path d="M12 12c2-2 2-6-2-6s-4 4-6 6c2 2 2 6 6 6s4-4 2-6z" />
  </svg>
);

export default function RifaLanding() {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
      {/* Imagen de fondo completa (ya incluye todo el diseño) */}
      <div className="relative flex-1 min-h-[70vh]">
        <Image
          src="/images/ryan-castro.png"
          alt="Rifa Crisbo Tattoo - Gánate 1 Tatuaje + 1 Boleta Ryan Castro"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Info Cards - Fondo oscuro */}
      <div className="bg-bg px-4 py-6">
        {/* Primera fila */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <InfoCard
            icon={<TattooIcon />}
            label="TATUAJE 25 CM"
            value="B/N"
            valueColor="text-gold"
          />
          <InfoCard
            icon={<CoinsIcon />}
            label="VALOR TATUAJE"
            value="$1.000.000"
            valueColor="text-cream"
            bordered
          />
          <InfoCard
            icon={<TicketIcon />}
            label="BOLETA"
            value="ORIENTAL BAJA"
            valueColor="text-gold"
          />
        </div>

        {/* Segunda fila */}
        <div className="grid grid-cols-3 gap-2">
          <InfoCard
            icon={<CalendarIcon />}
            label="JUEGA"
            value="24 OCT 2026"
            valueColor="text-gold"
          />
          <InfoCard
            icon={<NumbersIcon />}
            label="VALOR BOLETA"
            value="$30.000"
            valueColor="text-cream"
            bordered
          />
          <InfoCard
            icon={<CloverIcon />}
            label="LOTERÍA"
            value="DE BOYACÁ"
            valueColor="text-gold"
          />
        </div>

        {/* Botón Participar */}
        <div className="pt-6 pb-2">
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
        </div>
      </div>

      {/* Selector de boletas */}
      {showSelector && (
        <TicketSelector onClose={() => setShowSelector(false)} />
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, valueColor = "text-cream", bordered = false }) {
  return (
    <div className={`text-center py-3 px-2 ${bordered ? 'border-x border-line' : ''}`}>
      <div className="text-gold flex justify-center mb-1">
        {icon}
      </div>
      <p className="text-cream/60 text-[9px] tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </p>
      <p className={`${valueColor} text-xs font-semibold tracking-wide`} style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  );
}
