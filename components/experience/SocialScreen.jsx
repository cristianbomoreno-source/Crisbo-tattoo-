"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Instagram, MessageCircle, PlayCircle, MapPin, Clock } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, Smiley, Splash, CircleX } from "@/components/ui/EditorialDoodles";

const socialLinks = [
  {
    id: "instagram",
    title: "INSTAGRAM",
    handle: "@crisbotattoo",
    description: "Proyectos, proceso y behind the scenes",
    url: "https://instagram.com/crisbotattoo",
    icon: Instagram,
    accent: "gold",
  },
  {
    id: "whatsapp",
    title: "WHATSAPP",
    handle: "+57 320 210 7769",
    description: "Cotizaciones y agendamiento",
    url: "https://wa.me/573202107769",
    icon: MessageCircle,
    accent: "teal",
  },
  {
    id: "tiktok",
    title: "TIKTOK",
    handle: "@crisbotattoo",
    description: "Videos de proceso y tips",
    url: "https://tiktok.com/@crisbotattoo",
    icon: PlayCircle,
    accent: "gold",
  },
];

const infoSections = [
  {
    id: "historia",
    title: "MI HISTORIA",
    description: "+9 años tatuando y creando proyectos únicos.",
    screen: "quote",
    chapter: 1,
  },
  {
    id: "estudio",
    title: "EL ESTUDIO",
    description: "Conoce el espacio donde trabajo.",
    screen: "quote",
    chapter: 3,
  },
];

export default function SocialScreen() {
  const { goToScreen, goToChapter } = useExperience();

  const goToSection = (screen, chapter) => {
    goToScreen(screen);
    if (chapter) goToChapter(chapter);
  };

  return (
    <div className="min-h-screen pt-14 pb-8 px-5 grain">
      {/* Background word */}
      <div className="absolute top-1/4 -right-12 font-gothic text-[70px] text-cream/[0.03] leading-none select-none pointer-events-none rotate-12">
        SOCIAL
      </div>

      {/* Background splash */}
      <div className="absolute bottom-20 -left-8 opacity-50">
        <Splash size={100} color="teal" />
      </div>

      {/* Back */}
      <button
        onClick={() => goToScreen("home")}
        className="flex items-center gap-2 text-muted mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-display">INICIO</span>
      </button>

      {/* Title - Gothic */}
      <div className="relative mb-8">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">CONECTA</span>
          <span className="word-reveal block text-teal stagger-2">CONMIGO.</span>
        </h1>
        <Star6 className="absolute -right-1 top-0" size={28} color="teal" />
        <Smiley className="absolute right-8 bottom-0" size={24} color="gold" />
      </div>

      {/* Social Links - Editorial cards */}
      <div className="space-y-3 mb-10">
        {socialLinks.map((link, i) => {
          const Icon = link.icon;
          const isTeal = link.accent === "teal";

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 p-4 bg-surface border-l-4 animate-fade-up torn-paper ${
                isTeal ? "border-teal" : "border-gold"
              }`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isTeal ? "bg-teal/20" : "bg-gold/20"
              }`}>
                <Icon size={22} className={isTeal ? "text-teal" : "text-gold"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base text-cream">{link.title}</p>
                <p className={`text-sm ${isTeal ? "text-teal" : "text-gold"}`}>{link.handle}</p>
                <p className="text-muted text-xs mt-0.5">{link.description}</p>
              </div>
              <ArrowRight size={18} className="text-muted flex-shrink-0" />
            </a>
          );
        })}
      </div>

      {/* Sticker */}
      <div className="sticker sticker-teal absolute right-6 top-[45%] stagger-4">
        FOLLOW
      </div>

      {/* Know more sections */}
      <p className="label-gold mb-4 flex items-center gap-2">
        CONOCE MÁS
        <Star4 size={14} color="gold" animate={false} />
      </p>
      <div className="space-y-3 mb-10">
        {infoSections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => goToSection(section.screen, section.chapter)}
            className="w-full flex items-center justify-between p-4 bg-surface border border-line text-left animate-fade-up torn-paper"
            style={{ animationDelay: `${(i + 3) * 0.08}s` }}
          >
            <div>
              <p className="font-display text-base text-cream">{section.title}</p>
              <p className="text-muted text-xs mt-0.5">{section.description}</p>
            </div>
            <ArrowRight size={18} className="text-muted" />
          </button>
        ))}
      </div>

      {/* Location - Editorial card */}
      <div className="bg-surface border-l-4 border-teal p-5 torn-paper animate-fade-up stagger-6">
        <div className="flex items-start gap-3 mb-4">
          <CircleX size={24} color="teal" animate={false} />
          <div>
            <p className="font-gothic text-lg text-cream">CRISBO TATTOO</p>
            <p className="text-muted text-sm">Colina Campestre</p>
            <p className="text-muted text-sm">Bogotá, Colombia</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t border-line">
          <Clock size={20} className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-cream text-sm">Lunes a Sábado</p>
            <p className="text-muted text-sm">10:00 a.m. - 7:00 p.m.</p>
            <p className="text-cement text-xs mt-1">Solo con cita previa</p>
          </div>
        </div>

        <a
          href="https://goo.gl/maps/..."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-teal text-sm hover:text-teal-light transition-colors"
        >
          <MapPin size={14} />
          VER EN GOOGLE MAPS
          <ArrowRight size={14} />
        </a>
      </div>

      {/* CTA */}
      <button
        onClick={() => goToSection("quote", 1)}
        className="mt-8 btn-primary w-full"
      >
        COTIZAR MI TATUAJE
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
