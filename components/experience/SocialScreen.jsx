"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Instagram, MessageCircle, PlayCircle, MapPin, Clock } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";
import { Star } from "@/components/ui/Doodles";

const socialLinks = [
  {
    id: "instagram",
    title: "INSTAGRAM",
    handle: "@crisbotattoo",
    description: "Proyectos, proceso y behind the scenes",
    url: "https://instagram.com/crisbotattoo",
    icon: Instagram,
  },
  {
    id: "whatsapp",
    title: "WHATSAPP",
    handle: "+57 320 210 7769",
    description: "Cotizaciones y agendamiento",
    url: "https://wa.me/573202107769",
    icon: MessageCircle,
  },
  {
    id: "tiktok",
    title: "TIKTOK",
    handle: "@crisbotattoo",
    description: "Videos de proceso y tips",
    url: "https://tiktok.com/@crisbotattoo",
    icon: PlayCircle,
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
      {/* Background text */}
      <div className="bg-text top-1/4 -right-10 rotate-12">SOCIAL</div>

      {/* Back */}
      <button
        onClick={() => goToScreen("home")}
        className="flex items-center gap-2 text-muted mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">INICIO</span>
      </button>

      {/* Title */}
      <div className="relative">
        <TitleReveal
          className="text-mobile-title mb-8"
          lines={[
            { text: "CONECTA" },
            { text: "CONMIGO.", gold: true },
          ]}
        />
        <Star className="absolute top-0 right-0" size={28} />
      </div>

      {/* Social Links */}
      <div className="space-y-3 mb-10">
        {socialLinks.map((link, i) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-surface border border-line rounded-lg animate-fade-in-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <link.icon size={22} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg text-ink">{link.title}</p>
              <p className="text-gold text-sm">{link.handle}</p>
              <p className="text-muted text-xs mt-0.5">{link.description}</p>
            </div>
            <ArrowRight size={18} className="text-muted flex-shrink-0" />
          </a>
        ))}
      </div>

      {/* Know more sections */}
      <p className="label-gold mb-4">CONOCE MÁS</p>
      <div className="space-y-3 mb-10">
        {infoSections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => goToSection(section.screen, section.chapter)}
            className="w-full flex items-center justify-between p-4 bg-surface border border-line rounded-lg text-left animate-fade-in-up"
            style={{ animationDelay: `${(i + 3) * 0.08}s` }}
          >
            <div>
              <p className="font-display text-lg text-ink">{section.title}</p>
              <p className="text-muted text-xs mt-0.5">{section.description}</p>
            </div>
            <ArrowRight size={18} className="text-muted" />
          </button>
        ))}
      </div>

      {/* Location */}
      <div className="bg-surface border border-line rounded-lg p-5 animate-fade-in stagger-6">
        <div className="flex items-start gap-3 mb-4">
          <MapPin size={20} className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-lg text-ink">CRISBO TATTOO STUDIO</p>
            <p className="text-muted text-sm">Colina Campestre</p>
            <p className="text-muted text-sm">Bogotá, Colombia</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t border-line">
          <Clock size={20} className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-ink text-sm">Lunes a Sábado</p>
            <p className="text-muted text-sm">10:00 a.m. - 7:00 p.m.</p>
            <p className="text-cement text-xs mt-1">Solo con cita previa</p>
          </div>
        </div>

        <a
          href="https://goo.gl/maps/..."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-gold text-sm"
        >
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
        <ArrowRight size={16} className="arrow" />
      </button>
    </div>
  );
}
