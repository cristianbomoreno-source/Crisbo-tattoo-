"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, CurvedArrow, Smiley, Splash } from "@/components/ui/EditorialDoodles";

export default function HomeScreen() {
  const { goToScreen, goToChapter } = useExperience();

  const startQuote = () => {
    goToScreen("quote");
    goToChapter(1);
  };

  return (
    <div className="min-h-screen flex flex-col pt-14 grain">
      {/* === HERO SECTION === */}
      <section className="relative px-5 pt-6 pb-10">
        {/* Background word */}
        <div className="absolute top-20 -left-4 font-gothic text-[100px] text-cream/[0.03] leading-none select-none pointer-events-none -rotate-6">
          CRISBO
        </div>

        {/* Welcome label */}
        <div className="flex items-center gap-2 text-muted animate-fade-up">
          <span className="label">WELCOME</span>
          <span className="w-1 h-1 rounded-full bg-muted" />
          <span className="label">BOGOTÁ</span>
          <span className="w-1 h-1 rounded-full bg-muted" />
          <span className="label">2026</span>
        </div>

        {/* Main Title - Gothic */}
        <div className="mt-6 relative">
          <h1 className="font-gothic text-poster-lg text-cream leading-[0.85]">
            <span className="word-reveal block">¿QUÉ QUIERES</span>
            <span className="word-reveal block text-gold stagger-2">HACER HOY?</span>
          </h1>

          {/* Doodles */}
          <Star4 className="absolute -right-2 top-2" size={32} />
          <Smiley className="absolute right-8 bottom-0" size={28} color="teal" />
        </div>

        {/* Photo collage area */}
        <div className="mt-8 relative">
          {/* Splash background */}
          <div className="absolute -right-8 -top-4 opacity-90">
            <Splash size={120} color="gold" />
          </div>

          {/* Teal circle behind photo */}
          <div className="absolute right-4 top-8 w-32 h-32 rounded-full bg-teal/30" />

          {/* Main photo */}
          <div className="relative w-48 h-60 ml-auto mr-4">
            <div className="absolute inset-0 photo-reveal stagger-3">
              <Image
                src="/images/about.jpg"
                alt="Crisbo tatuando"
                fill
                className="object-cover photo-editorial"
                priority
              />
              {/* Tape decoration */}
              <div className="tape -top-2 left-4 stagger-5" />
            </div>
          </div>

          {/* Star decoration */}
          <Star6 className="absolute left-4 bottom-4" size={36} color="teal" />
          <CurvedArrow className="absolute left-12 top-8 rotate-45" size={32} />
        </div>

        {/* Sticker */}
        <div className="sticker absolute right-4 bottom-20 stagger-6">
          TATTOO ARTIST
        </div>
      </section>

      {/* === 3 CAMINOS === */}
      <section className="px-5 pb-8 flex-1 flex flex-col gap-4">
        <p className="label-gold mb-2 animate-fade-up stagger-4">ELIGE TU CAMINO</p>

        {/* CARD 1 - COTIZAR (Principal - Amarillo) */}
        <button
          onClick={startQuote}
          className="relative overflow-hidden animate-fade-up stagger-5"
        >
          <div className="relative bg-surface border-l-4 border-gold p-5 min-h-[160px] flex flex-col justify-between">
            {/* Background torn paper effect */}
            <div className="absolute -right-8 -top-4 w-40 h-40 bg-gold/10 torn-paper rotate-3" />

            {/* Number */}
            <div className="relative z-10">
              <span className="font-gothic text-4xl text-gold">01</span>
              <Star4 className="absolute -right-2 -top-1" size={16} animate={false} />
            </div>

            {/* Content */}
            <div className="relative z-10 mt-4">
              <h2 className="font-display text-2xl text-cream leading-tight">
                COTIZAR<br />
                <span className="text-gold">MI TATUAJE</span>
              </h2>
              <p className="text-muted text-sm mt-2 max-w-[200px]">
                Cuéntame tu idea y construyamos tu proyecto.
              </p>
            </div>

            {/* Arrow button */}
            <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-hard">
              <ArrowRight size={20} className="text-bg" />
            </div>

            {/* Tape */}
            <div className="tape top-2 right-12 rotate-6" />
          </div>
        </button>

        {/* CARD 2 - PORTAFOLIO (Teal accent) */}
        <button
          onClick={() => goToScreen("portfolio")}
          className="relative overflow-hidden animate-fade-up stagger-6"
        >
          <div className="relative min-h-[130px] flex">
            {/* Photo side */}
            <div className="relative w-2/5 overflow-hidden">
              <Image
                src="/images/sp-black-grey.jpg"
                alt="Portafolio"
                fill
                className="object-cover photo-editorial"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface" />
            </div>

            {/* Content side */}
            <div className="flex-1 bg-surface p-4 flex flex-col justify-between border-t-2 border-teal">
              <div>
                <span className="font-gothic text-2xl text-teal">02</span>
                <h2 className="font-display text-lg text-cream mt-1">
                  VER PORTAFOLIO
                </h2>
              </div>
              <p className="text-muted text-xs">
                Explora estilos y proyectos.
              </p>
            </div>

            {/* Sticker */}
            <div className="sticker sticker-teal absolute top-2 right-2 text-[8px]">
              +500 WORKS
            </div>
          </div>
        </button>

        {/* CARD 3 - REDES */}
        <button
          onClick={() => goToScreen("social")}
          className="relative overflow-hidden animate-fade-up stagger-7"
        >
          <div className="relative bg-surface p-4 min-h-[100px] flex items-center gap-4 border border-line">
            {/* Number */}
            <span className="font-gothic text-3xl text-cream/50">03</span>

            {/* Content */}
            <div className="flex-1">
              <h2 className="font-display text-lg text-cream">
                REDES / <span className="text-muted">CONOCER MÁS</span>
              </h2>
              <p className="text-muted text-xs mt-1">
                Contenido, historias y detrás de cámaras.
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight size={20} className="text-muted" />
          </div>
        </button>
      </section>

      {/* === FOOTER MINI === */}
      <footer className="px-5 py-4 border-t border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-white.png"
              alt="Crisbo"
              width={60}
              height={20}
              className="opacity-60"
            />
          </div>
          <p className="label">BOGOTÁ, CO</p>
        </div>
      </footer>
    </div>
  );
}
