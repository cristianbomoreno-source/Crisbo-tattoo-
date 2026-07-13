"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center bp-grid overflow-hidden pt-28 pb-16 lg:pt-0 lg:pb-0"
    >
      {/* decorative blueprint circle + crosses */}
      <div className="pointer-events-none absolute -right-40 top-1/4 w-[560px] h-[560px] rounded-full border border-gold/10 hidden lg:block" />
      <div className="pointer-events-none absolute right-24 top-1/3 w-3 h-3 bp-cross hidden lg:block" />
      <div className="pointer-events-none absolute left-10 bottom-24 w-3 h-3 bp-cross hidden lg:block" />
      <div className="pointer-events-none absolute left-6 top-40 w-3 h-3 bp-cross hidden lg:block" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[45%_55%] gap-14 items-center w-full">
        {/* LEFT */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="section-eyebrow text-gold-2 text-xs uppercase flex items-center gap-3 mb-6"
          >
            <span className="w-6 h-px bg-gold-2" />
            Bogotá, Colombia
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display leading-[0.82] tracking-wide text-[70px] sm:text-[90px] lg:text-[104px]"
          >
            CRISBO
            <span className="block font-brush text-gold-2 text-[56px] sm:text-[72px] lg:text-[84px] leading-none -mt-1 sm:-mt-3 drop-shadow-[0_4px_18px_rgba(247,196,0,0.25)]">
              Tattoo
            </span>
          </motion.h1>

          <motion.div
            variants={item}
            className="flex flex-wrap gap-3 text-xs sm:text-sm tracking-[0.2em] uppercase text-ink/70 mt-6 mb-6"
          >
            <span>Black &amp; Grey</span>
            <span className="text-gold-2">•</span>
            <span>Realismo</span>
            <span className="text-gold-2">•</span>
            <span>Blackwork</span>
          </motion.div>

          <motion.p
            variants={item}
            className="border-l-2 border-gold-2 pl-4 text-lg sm:text-xl text-ink max-w-md mb-8"
          >
            Diseños exclusivos que cuentan tu historia.
          </motion.p>

          <motion.div variants={item} className="flex flex-col items-start gap-2">
            <a
              href="https://wa.me/573202107769"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden inline-flex items-center gap-3 bg-gold-2 text-bg font-semibold text-sm sm:text-base tracking-wide uppercase px-8 py-5 rounded-sm hover:-translate-y-1 hover:shadow-gold-glow transition-all duration-300 w-full sm:w-auto justify-center"
            >
              <MessageCircle size={19} strokeWidth={2.4} />
              Cotizar por WhatsApp
              <span className="absolute inset-0 bg-white/20 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 skew-x-12" />
            </a>
            <span className="text-xs text-ink/50 tracking-wide pl-1">
              Respuesta rápida y personalizada
            </span>
          </motion.div>
        </motion.div>

        {/* RIGHT — photo */}
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] max-h-[640px] mx-auto w-full max-w-md lg:max-w-none rounded-sm overflow-hidden grain"
        >
          {/* yellow splash + techy backdrop behind photo */}
          <div className="absolute -inset-6 -z-10 hidden lg:block">
            <div className="absolute right-0 top-10 w-72 h-72 rounded-full border border-gold/15" />
            <div className="absolute right-10 bottom-0 w-40 h-40 bg-gold-2/10 blur-3xl rounded-full" />
          </div>

          <Image
            src="/images/hero-tattoo.jpg"
            alt="Crisbo tatuando en su estudio en Bogotá"
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 55vw"
            className="object-cover object-center"
          />

          {/* vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/30 via-transparent to-transparent" />

          <span className="absolute top-5 right-5 text-[10px] tracking-[0.25em] uppercase text-ink/60">
            Est.
            <span className="block text-gold-2 text-sm tracking-widest">2016</span>
          </span>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="absolute bottom-5 left-5 right-5 glass-dark px-5 py-4 flex items-center gap-4 rounded-sm animate-float-slow"
          >
            <span className="font-display text-3xl text-gold-2">+9</span>
            <span className="text-[11px] tracking-wide uppercase text-ink/70 leading-snug">
              Años de
              <br />
              experiencia
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
