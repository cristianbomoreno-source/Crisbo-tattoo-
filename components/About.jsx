"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";

export default function About() {
  return (
    <section id="sobre-mi" className="py-28 lg:py-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[5/4] rounded-sm overflow-hidden bg-bg-secondary border border-line/60"
        >
          <Image
            src="/images/about.jpg"
            alt="Crisbo, tatuador en Bogotá"
            fill
            sizes="(max-width: 1024px) 90vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bp-grid opacity-20" />
          <button
            aria-label="Reproducir video"
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gold-2 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-gold-glow"
          >
            <Play size={22} className="text-bg ml-1" fill="currentColor" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="section-eyebrow text-gold-2 text-xs uppercase flex items-center gap-3 mb-5">
            <span className="w-6 h-px bg-gold-2" />
            Sobre mí
          </p>
          <h2 className="font-display text-4xl sm:text-5xl leading-[0.95] tracking-wide mb-6">
            PASIÓN. DISCIPLINA.
            <span className="text-gold-2"> ARTE.</span>
          </h2>
          <p className="text-ink/60 text-base sm:text-lg leading-relaxed max-w-md mb-8">
            Más de 9 años dedicados al arte del tatuaje en Bogotá. Cada proyecto
            comienza desde cero, escuchando tu historia y transformándola en una
            pieza única que te acompañará toda la vida.
          </p>
          <p className="font-brush text-gold-2 text-3xl">Crisbo</p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink/40 mt-1">
            Tattoo Artist
          </p>
        </motion.div>
      </div>
    </section>
  );
}
