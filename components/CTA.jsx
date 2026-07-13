"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import FAQ from "./FAQ";

export default function CTA() {
  return (
    <section id="faq" className="py-28 lg:py-36 bp-grid">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <FAQ />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-bg-secondary border border-line/60 rounded-sm p-10 sm:p-12 flex flex-col justify-center overflow-hidden"
        >
          <div className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full border border-gold/10" />
          <div className="absolute right-6 bottom-6 w-24 h-24 bg-gold-2/10 blur-2xl rounded-full" />

          <h3 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-[0.95] tracking-wide mb-5 relative">
            ¿LISTO PARA CONVERTIR TU IDEA EN UNA{" "}
            <span className="text-gold-2">OBRA DE ARTE?</span>
          </h3>
          <p className="text-ink/50 text-sm sm:text-base mb-8 relative">
            Agenda tu cita hoy mismo.
          </p>
          <a
            href="https://wa.me/573202107769"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-fit inline-flex items-center gap-3 bg-gold-2 text-bg font-semibold text-sm tracking-wide uppercase px-7 py-4 rounded-sm hover:-translate-y-1 hover:shadow-gold-glow transition-all duration-300"
          >
            <MessageCircle size={18} />
            Hablar por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}
