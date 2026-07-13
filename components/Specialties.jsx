"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const specialties = [
  { title: "Black & Grey", img: "/images/sp-black-grey.jpg" },
  { title: "Realismo", img: "/images/sp-realismo.jpg" },
  { title: "Blackwork", img: "/images/sp-blackwork.jpg" },
  { title: "Diseños personalizados", img: "/images/sp-personalizado.jpg" },
  { title: "Cover Up", img: "/images/sp-coverup.jpg" },
  { title: "Proyectos de gran formato", img: "/images/sp-granformato.jpg" },
];

export default function Specialties() {
  return (
    <section id="trabajos" className="py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <h2 className="font-display text-3xl sm:text-4xl tracking-wide flex items-center gap-4">
            <span className="w-8 h-px bg-gold-2 inline-block" />
            ESPECIALIDADES
          </h2>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold-2 hover:gap-3 transition-all duration-300"
          >
            Ver todos los trabajos <ArrowRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {specialties.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative aspect-[3/4] rounded-sm overflow-hidden border border-line/60 bg-bg-secondary cursor-pointer"
            >
              {/* real tattoo photo */}
              <Image
                src={s.img}
                alt={s.title}
                fill
                sizes="(max-width: 640px) 50vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-gold-2/10" />
              <div className="absolute inset-0 shadow-[inset_0_0_0_0_rgba(247,196,0,0)] group-hover:shadow-[inset_0_0_40px_0_rgba(247,196,0,0.15)] transition-all duration-500" />

              <div className="absolute inset-0 flex items-end p-4">
                <span className="text-xs sm:text-[13px] uppercase tracking-wide leading-snug bg-gradient-to-t from-bg/0 to-transparent">
                  {s.title}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
