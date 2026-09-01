"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

export default function Chapter01Artist() {
  const { nextChapter, goToChapter } = useExperience();

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Background text */}
      <div className="bg-text bottom-1/4 right-0">CRISBO</div>

      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">01 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "CONOCE AL" },
          { text: "ARTISTA.", gold: true },
        ]}
      />

      {/* Photo */}
      <div className="mt-8 relative aspect-[4/5] max-h-[50vh] rounded-lg overflow-hidden animate-fade-in stagger-3">
        <Image
          src="/images/about.jpg"
          alt="Crisbo tatuando"
          fill
          className="object-cover image-reveal editorial-image"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4 animate-fade-in stagger-4">
        <p className="text-ink text-lg font-medium">
          Soy Crisbo, tatuador en Bogotá.
        </p>
        <p className="text-muted leading-relaxed">
          No diseño imágenes aisladas. Creo proyectos que cuentan historias y se adaptan a tu cuerpo.
        </p>
      </div>

      {/* Tags */}
      <div className="mt-6 flex flex-wrap gap-2 animate-fade-in stagger-5">
        {["BOGOTÁ", "BLACK & GREY", "REALISMO", "CUSTOM PROJECTS"].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 bg-surface border border-line rounded text-xs text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-8 flex items-center justify-between animate-fade-in stagger-6">
        <button
          onClick={() => goToChapter(4, false)}
          className="btn-ghost"
        >
          OMITIR
        </button>

        <button
          onClick={nextChapter}
          className="btn-primary"
        >
          CONTINUAR
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}
