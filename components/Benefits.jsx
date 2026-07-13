"use client";

import { motion } from "framer-motion";
import { Gem, ShieldCheck, Heart, Clock } from "lucide-react";

const benefits = [
  {
    icon: Gem,
    title: "Diseños personalizados",
    desc: "100% únicos",
  },
  {
    icon: ShieldCheck,
    title: "Materiales premium",
    desc: "De alta calidad",
  },
  {
    icon: Heart,
    title: "Enfoque en tu historia",
    desc: "Cada detalle importa",
  },
  {
    icon: Clock,
    title: "Más de 9 años",
    desc: "De trayectoria en Bogotá",
  },
];

export default function Benefits() {
  return (
    <section className="border-y border-line/60 bg-bg-secondary">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group flex items-center gap-4 px-6 py-8 border-line/60 [&:not(:last-child)]:border-r-0 lg:[&:not(:last-child)]:border-r border-b lg:border-b-0 hover:bg-bg-grey/60 transition-colors duration-300"
          >
            <b.icon
              size={26}
              strokeWidth={1.4}
              className="text-gold-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
            />
            <div>
              <h4 className="text-[13px] uppercase tracking-wide mb-1">{b.title}</h4>
              <p className="text-xs text-ink/50">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
