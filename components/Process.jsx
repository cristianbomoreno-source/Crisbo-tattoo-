"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    num: "01",
    title: "CONCEPTO",
    desc: "Escucho tu idea, referencias y vision. Entendemos juntos que quieres comunicar.",
  },
  {
    num: "02",
    title: "DISENO",
    desc: "Creo una propuesta exclusiva pensada para tu cuerpo y composicion anatomica.",
  },
  {
    num: "03",
    title: "SESION",
    desc: "Ejecutamos el proyecto con la mejor tecnica, higiene y atencion al detalle.",
  },
  {
    num: "04",
    title: "RESULTADO",
    desc: "Una pieza que funciona, que fluye con tu cuerpo y que perdurara en el tiempo.",
  },
];

export default function Process() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("visible"), i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 lg:py-40 px-5 md:px-8 lg:px-12 bg-bg-secondary"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Title */}
        <div className="reveal max-w-3xl mb-16 md:mb-24">
          <h2 className="font-display text-section uppercase leading-[0.9]">
            EL TATUAJE<br />
            ES EL RESULTADO.<br />
            <span className="text-ink-muted">EL PROCESO ES<br />DONDE EMPIEZA TODO.</span>
          </h2>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`reveal delay-${i + 1} bg-bg-secondary p-8 md:p-10`}
            >
              {/* Number */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-display text-5xl md:text-6xl text-ink">{step.num}</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl md:text-2xl text-ink mb-4">
                {step.title}
              </h3>
              <p className="text-ink-muted text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="reveal delay-4 mt-16 md:mt-24 grid md:grid-cols-3 gap-8">
          <div>
            <p className="label mb-2">CONCEPTUALIZACION</p>
            <p className="text-ink-muted text-sm leading-relaxed">
              Cada proyecto comienza con una conversacion. Entender tu historia
              es el primer paso para crear algo unico.
            </p>
          </div>
          <div>
            <p className="label mb-2">ADAPTACION ANATOMICA</p>
            <p className="text-ink-muted text-sm leading-relaxed">
              El diseno se adapta a las lineas naturales de tu cuerpo,
              no al reves.
            </p>
          </div>
          <div>
            <p className="label mb-2">SEGUIMIENTO</p>
            <p className="text-ink-muted text-sm leading-relaxed">
              El proceso no termina en la sesion. Te acompano durante
              toda la cicatrizacion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
