"use client";

import { Palette, Music, Gift } from "lucide-react";

export default function PrizeSection() {
  return (
    <section className="py-20 px-mobile bg-surface relative grain">
      {/* Cinta decorativa superior */}
      <div className="tape tape-teal w-20 -top-3 left-1/4 rotate-[-5deg]" />
      <div className="tape w-24 -top-2 right-1/3 rotate-[3deg]" />

      <div className="max-w-4xl mx-auto">
        {/* Título de sección */}
        <div className="text-center mb-12">
          <span className="label text-xs">01 / EL PREMIO</span>
          <h2 className="font-gothic text-poster-md text-gold mt-2">
            QUE TE GANAS?
          </h2>
        </div>

        {/* Cards de premios */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Premio principal - Tatuaje */}
          <div className="card-collage p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-gold flex items-center justify-center">
                <Palette className="w-6 h-6 text-bg" />
              </div>
              <div className="sticker">PRINCIPAL</div>
            </div>

            <div>
              <h3 className="font-display text-2xl text-cream">TATUAJE VALORADO EN</h3>
              <p className="font-gothic text-poster-sm text-gold">$1,000,000 COP</p>
            </div>

            <ul className="space-y-2 text-muted text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Diseño personalizado
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Black & Grey o Color
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Sesion completa incluida
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Valido hasta Dic 2026
              </li>
            </ul>

            {/* Tape decorativa */}
            <div className="tape w-16 -bottom-2 right-4" />
          </div>

          {/* Premio bonus - Boleta */}
          <div className="card-collage p-6 space-y-4 border-l-4 border-l-teal">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-teal flex items-center justify-center">
                <Music className="w-6 h-6 text-cream" />
              </div>
              <div className="sticker sticker-teal">BONUS</div>
            </div>

            <div>
              <h3 className="font-display text-2xl text-cream">BOLETA CONCIERTO</h3>
              <p className="font-gothic text-poster-sm text-teal">RYAN CASTRO</p>
            </div>

            <ul className="space-y-2 text-muted text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-teal rounded-full" />
                Entrada general
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-teal rounded-full" />
                Bogota 2026
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-teal rounded-full" />
                Fecha por confirmar
              </li>
            </ul>

            {/* Tape decorativa */}
            <div className="tape tape-teal w-14 -bottom-2 left-6 rotate-[5deg]" />
          </div>
        </div>

        {/* Valor total */}
        <div className="mt-12 text-center">
          <div className="inline-block torn-paper bg-cream text-bg px-8 py-4">
            <p className="text-xs uppercase tracking-wider opacity-60">Valor total del premio</p>
            <p className="font-gothic text-3xl">+$1,200,000 COP</p>
          </div>
        </div>
      </div>
    </section>
  );
}
