"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "¿Cuánto debo abonar para agendar?",
    a: "El abono depende del tamaño y complejidad del diseño; se define al confirmar la propuesta y se descuenta del valor final.",
  },
  {
    q: "¿Cuánto tarda el diseño?",
    a: "El tiempo de diseño varía según la complejidad de la idea, normalmente se entrega antes de la fecha de la cita.",
  },
  {
    q: "¿Hacen diseños personalizados?",
    a: "Sí, cada diseño se crea desde cero a partir de tu idea, referencia o historia — no se repiten diseños entre clientes.",
  },
  {
    q: "¿Aceptan retoques?",
    a: "Sí, se incluye un control de cicatrización con posibilidad de retoque si es necesario.",
  },
  {
    q: "¿Cómo es el proceso de agendamiento?",
    a: "Escríbeme por WhatsApp o Instagram, conversamos sobre tu idea y agendamos tu cita con el abono correspondiente.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div>
      <h3 className="font-display text-2xl sm:text-3xl tracking-wide mb-8">
        PREGUNTAS FRECUENTES
      </h3>
      <div className="divide-y divide-line/60 border-t border-line/60">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-sm sm:text-[15px] group-hover:text-gold-2 transition-colors duration-300 pr-4">
                  {f.q}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gold-2 flex-shrink-0"
                >
                  <Plus size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs sm:text-sm text-ink/50 leading-relaxed pb-5 pr-8">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
