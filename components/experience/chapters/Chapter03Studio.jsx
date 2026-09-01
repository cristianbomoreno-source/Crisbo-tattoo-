"use client";

import Image from "next/image";
import { ArrowRight, Shield, Heart, Music, Users } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star6, CircleX, Asterisk } from "@/components/ui/EditorialDoodles";

const features = [
  {
    icon: Shield,
    title: "HIGIENE",
    description: "Protocolos estrictos",
  },
  {
    icon: Heart,
    title: "COMODIDAD",
    description: "Sesiones privadas",
  },
  {
    icon: Music,
    title: "AMBIENTE",
    description: "Música y buena energía",
  },
  {
    icon: Users,
    title: "SEGUIMIENTO",
    description: "Antes, durante y después",
  },
];

export default function Chapter03Studio() {
  const { nextChapter } = useExperience();

  return (
    <div className="min-h-screen flex flex-col px-5 pb-8 grain">
      {/* Chapter label */}
      <div className="mt-6 flex items-center gap-3 animate-fade-up">
        <span className="label-gold">03 / 09</span>
        <div className="flex-1 h-px bg-line-gold" />
      </div>

      {/* Title - Gothic */}
      <div className="mt-6 relative">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">CONOCE EL</span>
          <span className="word-reveal block text-teal stagger-2">ESTUDIO.</span>
        </h1>
        <Star6 className="absolute -right-2 top-0" size={32} color="teal" />
      </div>

      {/* Photo collage */}
      <div className="mt-6 relative">
        {/* Circle decoration */}
        <div className="absolute -right-4 top-4 w-28 h-28 rounded-full bg-teal/15" />

        {/* Main photo */}
        <div className="relative aspect-[16/10] photo-reveal stagger-2">
          <Image
            src="/images/about.jpg"
            alt="Crisbo Tattoo Studio"
            fill
            className="object-cover photo-editorial"
          />
          <div className="tape top-2 -right-2 rotate-12 stagger-4" />
        </div>

        {/* Doodle */}
        <Asterisk className="absolute -left-2 -bottom-4" size={24} color="teal" />
      </div>

      {/* Sticker */}
      <div className="sticker sticker-teal absolute left-6 top-[40%] -rotate-6 stagger-5">
        BOGOTÁ
      </div>

      {/* Description */}
      <p className="mt-6 text-muted leading-relaxed animate-fade-up stagger-3">
        Un espacio creado para trabajar con enfoque y tranquilidad.
      </p>

      {/* Features Grid - Editorial style */}
      <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up stagger-4">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`bg-surface border p-4 torn-paper ${
              i % 2 === 0 ? "border-teal/30" : "border-line"
            }`}
          >
            <feature.icon size={20} className={i % 2 === 0 ? "text-teal" : "text-gold"} />
            <p className="font-display text-sm text-cream mt-2">{feature.title}</p>
            <p className="text-muted text-xs mt-1">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="mt-6 pt-4 border-t border-line animate-fade-up stagger-5 flex items-start gap-4">
        <CircleX size={24} color="teal" animate={false} />
        <div>
          <p className="label-gold">UBICACIÓN</p>
          <p className="mt-1 font-display text-lg text-cream">COLINA CAMPESTRE</p>
          <p className="text-muted text-sm">Bogotá, Colombia</p>
        </div>
      </div>

      {/* Action */}
      <div className="mt-auto pt-8 flex justify-end animate-fade-up stagger-6">
        <button
          onClick={nextChapter}
          className="btn-teal"
        >
          CONTINUAR
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
