"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";
import { Star } from "@/components/ui/Doodles";

export default function Chapter09Final() {
  const { openWhatsApp } = useExperience();

  return (
    <div className="min-h-screen flex flex-col grain relative">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/about.jpg"
          alt="Crisbo trabajando"
          fill
          className="object-cover editorial-image"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-8 pt-20">
        {/* Doodles */}
        <Star className="absolute top-24 right-8" size={32} />

        {/* Chapter label */}
        <div className="animate-fade-in">
          <span className="label-gold">09 / 09</span>
        </div>

        {/* Title */}
        <div className="mt-auto">
          <TitleReveal
            className="text-mobile-hero"
            lines={[
              { text: "TU IDEA" },
              { text: "PUEDE SER" },
              { text: "EL PRÓXIMO" },
              { text: "PROYECTO.", gold: true },
            ]}
          />

          {/* Description */}
          <p className="mt-6 text-muted leading-relaxed animate-fade-in stagger-5 max-w-sm">
            Ahora ya conozco un poco más sobre lo que buscas. El siguiente paso es convertirlo juntos en una composición pensada para tu cuerpo.
          </p>

          {/* CTA */}
          <button
            onClick={openWhatsApp}
            className="mt-8 w-full whatsapp-cta flex items-center justify-center gap-3 min-h-[60px] rounded-lg text-bg font-semibold text-base tracking-wider animate-fade-in stagger-6"
          >
            <MessageCircle size={22} />
            ENVIAR MI PROYECTO A CRISBO
          </button>

          {/* Alternative */}
          <p className="mt-4 text-center text-cement text-xs animate-fade-in stagger-7">
            También puedes escribirme por Instagram
          </p>
        </div>
      </div>

      {/* Background text */}
      <div className="absolute bottom-32 -left-4 font-display text-[120px] text-ink/[0.03] leading-none pointer-events-none select-none">
        CRISBO
      </div>
    </div>
  );
}
