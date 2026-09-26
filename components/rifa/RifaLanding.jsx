"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Fondo con gradiente y efecto */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(10,10,10,0.3) 0%,
              rgba(10,10,10,0.1) 30%,
              rgba(10,10,10,0.7) 70%,
              rgba(10,10,10,1) 100%
            ),
            linear-gradient(to right,
              rgba(232, 90, 27, 0.3) 0%,
              rgba(232, 90, 27, 0.1) 50%,
              rgba(0,0,0,0.5) 100%
            ),
            radial-gradient(ellipse at 70% 30%, rgba(232, 90, 27, 0.4) 0%, transparent 60%)
          `,
        }}
      />

      {/* Imagen de Ryan Castro - placeholder con efecto naranja */}
      <div
        className="absolute top-0 right-0 w-full h-[70vh] z-0 opacity-90"
        style={{
          background: `
            linear-gradient(to bottom, transparent 60%, rgba(10,10,10,1) 100%),
            linear-gradient(to left, transparent 0%, rgba(10,10,10,0.8) 100%),
            url('/images/ryan-castro.png') no-repeat center top
          `,
          backgroundSize: 'cover',
          filter: 'sepia(30%) saturate(150%) hue-rotate(-10deg)',
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Logo */}
        <div className="pt-8 pb-4 text-center">
          <div className="inline-block">
            <div className="text-cream font-bold text-2xl tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-3xl">CB</span>
            </div>
            <div className="text-cream font-bold text-xl tracking-[0.3em]" style={{ fontFamily: 'var(--font-display)' }}>
              CRISBO
            </div>
            <div className="text-cream/70 text-[10px] tracking-[0.4em]">
              TATTOO STUDIO
            </div>
          </div>
        </div>

        {/* Título principal */}
        <div className="flex-1 flex flex-col justify-center px-5 pb-8">
          <div className="space-y-0">
            <h1
              className="text-cream text-[clamp(2.5rem,12vw,4.5rem)] leading-[0.95] font-bold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              GÁNATE
            </h1>
            <h2
              className="text-orange text-[clamp(3rem,15vw,6rem)] leading-[0.85] font-bold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              1 TATUAJE +
            </h2>
            <h2
              className="text-orange text-[clamp(3rem,15vw,6rem)] leading-[0.85] font-bold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              1 BOLETA
            </h2>
          </div>

          {/* Subtítulo Ryan Castro */}
          <div className="mt-6 space-y-0">
            <p
              className="text-cream/90 text-xl tracking-[0.15em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              RYAN CASTRO
            </p>
            <p
              className="text-gold text-sm tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              EN BOGOTÁ
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-4 pb-4">
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
        </div>

        {/* Botón Participar */}
        <div className="px-4 pb-8 pt-4">
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
