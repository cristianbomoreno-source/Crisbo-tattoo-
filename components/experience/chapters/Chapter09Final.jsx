"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, Crown, Splash } from "@/components/ui/EditorialDoodles";

export default function Chapter09Final() {
  const { openWhatsApp } = useExperience();

  return (
    <div className="min-h-screen flex flex-col grain relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/about.jpg"
          alt="Crisbo trabajando"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/90 to-bg/50" />
      </div>

      {/* Editorial decorations */}
      <div className="absolute top-20 right-4 opacity-70">
        <Splash size={120} color="gold" />
      </div>
      <div className="absolute bottom-1/3 -left-8 opacity-50">
        <Splash size={100} color="teal" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-8 pt-20">
        {/* Doodles */}
        <Star4 className="absolute top-24 right-8" size={28} />
        <Crown className="absolute top-28 left-4" size={32} color="gold" />

        {/* Chapter label */}
        <div className="flex items-center gap-3 animate-fade-up">
          <span className="label-gold">09 / 09</span>
          <div className="flex-1 h-px bg-line-gold" />
          <Star6 size={18} color="gold" animate={false} />
        </div>

        {/* Sticker */}
        <div className="sticker absolute right-4 top-40 stagger-4">
          FINAL
        </div>

        {/* Title - Gothic main */}
        <div className="mt-auto">
          <h1 className="font-gothic text-poster-lg text-cream leading-[0.85]">
            <span className="word-reveal block">TU IDEA</span>
            <span className="word-reveal block stagger-1">PUEDE SER</span>
            <span className="word-reveal block stagger-2">EL PRÓXIMO</span>
            <span className="word-reveal block text-gold stagger-3">PROYECTO.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-muted leading-relaxed animate-fade-up stagger-5 max-w-sm">
            Ahora ya conozco un poco más sobre lo que buscas. El siguiente paso es convertirlo juntos en una composición pensada para tu cuerpo.
          </p>

          {/* CTA - WhatsApp */}
          <button
            onClick={openWhatsApp}
            className="mt-8 w-full bg-[#25D366] hover:bg-[#22c55e] flex items-center justify-center gap-3 min-h-[60px] text-bg font-display text-base tracking-wider transition-colors animate-fade-up stagger-6 shadow-hard"
          >
            <MessageCircle size={22} />
            ENVIAR MI PROYECTO
          </button>

          {/* Tape decoration */}
          <div className="tape absolute -bottom-4 left-1/4 -rotate-3 stagger-7" />

          {/* Alternative */}
          <p className="mt-6 text-center text-cement text-xs animate-fade-up stagger-7">
            También puedes escribirme por Instagram @crisbotattoo
          </p>
        </div>
      </div>

      {/* Background word */}
      <div className="absolute bottom-40 -left-6 font-gothic text-[100px] text-cream/[0.03] leading-none pointer-events-none select-none -rotate-6">
        CRISBO
      </div>
    </div>
  );
}
