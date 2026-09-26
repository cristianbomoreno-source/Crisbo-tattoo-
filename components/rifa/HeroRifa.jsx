"use client";

import { RansomTitle } from "./RansomText";
import CountdownTimer from "./CountdownTimer";

export default function HeroRifa() {
  // Fecha del sorteo: 24 de octubre 2026
  const sorteoDate = "2026-10-24T20:00:00-05:00";

  return (
    <section className="relative min-h-screen flex flex-col justify-center py-20 px-mobile overflow-hidden grain">
      {/* Fondo con collage de fotos */}
      <div className="absolute inset-0 opacity-20">
        {/* Foto 1 - Tatuaje */}
        <div
          className="absolute top-10 left-[5%] w-32 h-40 bg-surface rotate-[-8deg] photo-frame"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}
        >
          <div className="w-full h-full bg-cement/50" />
        </div>

        {/* Foto 2 */}
        <div
          className="absolute top-20 right-[10%] w-28 h-36 bg-surface rotate-[5deg] photo-frame"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}
        >
          <div className="w-full h-full bg-cement/50" />
        </div>

        {/* Foto 3 */}
        <div
          className="absolute bottom-40 left-[15%] w-36 h-44 bg-surface rotate-[12deg] photo-frame"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}
        >
          <div className="w-full h-full bg-cement/50" />
        </div>
      </div>

      {/* Stickers decorativos */}
      <div className="absolute top-24 right-4 sm:right-10">
        <div className="sticker animate-sticker-pop" style={{ animationDelay: "0.3s" }}>
          $30K
        </div>
      </div>
      <div className="absolute top-40 left-4 sm:left-10">
        <div className="sticker sticker-teal animate-sticker-pop" style={{ animationDelay: "0.5s" }}>
          200 CUPOS
        </div>
      </div>
      <div className="absolute bottom-32 right-8">
        <div className="stamp stamp-gold rotate-[-15deg] animate-stamp" style={{ animationDelay: "0.7s" }}>
          24 OCT
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
        {/* Label superior */}
        <div className="label-teal animate-fade-up">CRISBO TATTOO PRESENTA</div>

        {/* Título principal estilo ransom note */}
        <div className="space-y-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <RansomTitle>RIFA</RansomTitle>
          <h1 className="font-display text-poster-md text-cream mt-4">
            TATUAJE + BOLETA
          </h1>
        </div>

        {/* Premios */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="torn-paper bg-gold text-bg px-6 py-4 text-center">
            <p className="text-xs font-body uppercase tracking-wider opacity-70">Premio principal</p>
            <p className="font-display text-2xl">TATUAJE $1M</p>
          </div>
          <span className="font-gothic text-3xl text-gold">+</span>
          <div className="torn-paper bg-teal text-cream px-6 py-4 text-center">
            <p className="text-xs font-body uppercase tracking-wider opacity-70">Bonus</p>
            <p className="font-display text-2xl">BOLETA RYAN CASTRO</p>
          </div>
        </div>

        {/* Info del sorteo */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-muted text-sm">
            Sorteo con la <span className="text-gold">Loteria de Colombia</span>
          </p>
          <p className="font-display text-xl text-cream">24 de Octubre, 2026</p>
        </div>

        {/* Countdown */}
        <div className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <CountdownTimer targetDate={sorteoDate} />
        </div>

        {/* CTA */}
        <div className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <a href="#boletas" className="btn-primary inline-flex">
            COMPRAR BOLETA - $30.000
          </a>
        </div>
      </div>

      {/* Doodles decorativos */}
      <svg className="absolute bottom-10 left-10 w-16 h-16 doodle doodle-gold doodle-draw opacity-50">
        <path d="M5 40 Q20 5 40 20 T75 10" />
      </svg>
      <svg className="absolute top-32 right-20 w-12 h-12 doodle doodle-teal doodle-draw opacity-50">
        <circle cx="20" cy="20" r="15" />
      </svg>
    </section>
  );
}
