"use client";

import { motion } from "framer-motion";
import { MessageSquare, PenTool, CalendarCheck, Zap, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MessageSquare,
    title: "Cuéntame tu idea",
    desc: "Hablamos de tu idea, estilo y ubicación del tatuaje.",
  },
  {
    num: "02",
    icon: PenTool,
    title: "Diseñamos una propuesta exclusiva",
    desc: "Creo un diseño 100% personalizado, único y original.",
  },
  {
    num: "03",
    icon: CalendarCheck,
    title: "Agendamos con un abono",
    desc: "Reservamos tu cita con un abono para asegurar tu fecha.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Creamos tu tatuaje",
    desc: "Ejecutamos con la mejor técnica, cuidado y precisión.",
  },
  {
    num: "05",
    icon: ShieldCheck,
    title: "Seguimiento y controles",
    desc: "Te acompaño en el proceso de cicatrización.",
  },
];

export default function Process() {
  return (
    <section id="proceso" className="py-28 lg:py-36 bg-bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 className="font-display text-3xl sm:text-4xl tracking-wide flex items-center gap-4 mb-14">
          <span className="w-8 h-px bg-gold-2 inline-block" />
          ¿CÓMO TRABAJAMOS?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative group"
            >
              <div className="bg-bg-grey border border-line/60 p-6 h-full hover:border-gold/40 hover:-translate-y-1.5 transition-all duration-300 rounded-sm">
                <span className="inline-block border border-gold-2 text-gold-2 font-display text-sm px-3 py-0.5 mb-6">
                  {s.num}
                </span>
                <s.icon size={22} strokeWidth={1.5} className="text-gold-2/80 mb-4" />
                <h4 className="text-sm uppercase tracking-wide mb-2 leading-snug">
                  {s.title}
                </h4>
                <p className="text-xs text-ink/50 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  size={16}
                  className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-gold-2/40 z-10"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
