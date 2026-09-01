"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, CurvedArrow, Splash } from "@/components/ui/EditorialDoodles";

export default function Chapter01Artist() {
  const { nextChapter, goToChapter } = useExperience();

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background word */}
      <div className="absolute top-32 -right-8 font-gothic text-[80px] text-cream/[0.03] leading-none select-none pointer-events-none rotate-6">
        CRISBO
      </div>

      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">01 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">CONOCE AL</span>
          <span className="word-reveal block text-gold stagger-2">ARTISTA.</span>
        </h1>
        <Star4 className="absolute -right-2 top-0" size={28} />
      </div>

      {/* Photo with editorial treatment */}
      <div className="mt-8 relative">
        {/* Splash background */}
        <div className="absolute -left-6 -top-4 opacity-80">
          <Splash size={100} color="teal" />
        </div>

        {/* Teal circle */}
        <div className="absolute left-4 top-8 w-24 h-24 rounded-full bg-teal/20" />

        {/* Main photo */}
        <div className="relative w-4/5 ml-auto aspect-[3/4] photo-reveal stagger-3">
          <Image
            src="/images/about.jpg"
            alt="Crisbo tatuando"
            fill
            className="object-cover photo-editorial"
            priority
          />
          {/* Tape decoration */}
          <div className="tape -top-2 left-6 stagger-5" />
          <div className="tape -bottom-2 right-4 rotate-12 stagger-6" />
        </div>

        {/* Arrow doodle */}
        <CurvedArrow className="absolute -left-2 bottom-12 -rotate-45" size={36} color="gold" />
      </div>

      {/* Sticker */}
      <div className="sticker absolute right-6 top-[45%] stagger-6">
        +9 AÑOS
      </div>

      {/* Content */}
      <div className="mt-8 space-y-4 animate-fade-up stagger-4">
        <p className="font-display text-xl text-cream">
          Soy Crisbo, tatuador en Bogotá.
        </p>
        <p className="text-muted leading-relaxed">
          No diseño imágenes aisladas. Creo proyectos que cuentan historias y se adaptan a tu cuerpo.
        </p>
      </div>

      {/* Tags */}
      <div className="mt-6 flex flex-wrap gap-2 animate-fade-up stagger-5">
        {["BOGOTÁ", "BLACK & GREY", "REALISMO", "CUSTOM"].map((tag, i) => (
          <span
            key={tag}
            className={`sticker ${i % 2 === 1 ? "sticker-teal" : ""} text-[10px]`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-8 flex items-center justify-between animate-fade-up stagger-6">
        <button
          onClick={() => goToChapter(4, false)}
          className="btn-ghost"
        >
          OMITIR INTRO
        </button>

        <button
          onClick={nextChapter}
          className="btn-primary"
        >
          CONTINUAR
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
