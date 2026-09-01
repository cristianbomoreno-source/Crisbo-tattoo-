"use client";

import Image from "next/image";
import { ArrowRight, Shield, Heart, Music, Users } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

const features = [
  {
    icon: Shield,
    title: "HIGIENE",
    description: "Protocolos estrictos en cada sesión.",
  },
  {
    icon: Heart,
    title: "COMODIDAD",
    description: "Sesiones privadas y atención personalizada.",
  },
  {
    icon: Music,
    title: "AMBIENTE",
    description: "Inspiración, música y buena energía.",
  },
  {
    icon: Users,
    title: "SEGUIMIENTO",
    description: "Te acompaño antes, durante y después.",
  },
];

export default function Chapter03Studio() {
  const { nextChapter } = useExperience();

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Chapter label */}
      <div className="mt-6 animate-fade-in">
        <span className="label-gold">03 / 09</span>
      </div>

      {/* Title */}
      <TitleReveal
        className="mt-4 text-mobile-title"
        lines={[
          { text: "CONOCE EL" },
          { text: "ESTUDIO.", gold: true },
        ]}
      />

      {/* Photo */}
      <div className="mt-6 relative aspect-[16/10] rounded-lg overflow-hidden animate-fade-in stagger-2">
        <Image
          src="/images/about.jpg"
          alt="Crisbo Tattoo Studio"
          fill
          className="object-cover image-reveal editorial-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      {/* Description */}
      <p className="mt-4 text-muted leading-relaxed animate-fade-in stagger-3">
        Un espacio creado para trabajar con enfoque y tranquilidad.
      </p>

      {/* Features Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-in stagger-4">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className="bg-surface border border-line rounded-lg p-4 animate-fade-in-up"
            style={{ animationDelay: `${0.4 + i * 0.1}s` }}
          >
            <feature.icon size={20} className="text-gold mb-2" />
            <p className="font-display text-sm text-ink">{feature.title}</p>
            <p className="text-muted text-xs mt-1 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="mt-6 pt-4 border-t border-line animate-fade-in stagger-5">
        <p className="label-gold">UBICACIÓN</p>
        <p className="mt-2 font-display text-xl text-ink">COLINA CAMPESTRE</p>
        <p className="text-muted text-sm">Bogotá, Colombia</p>
      </div>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end animate-fade-in stagger-6">
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
