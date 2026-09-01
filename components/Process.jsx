"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    num: "01",
    title: "CONCEPTO",
    desc: "Escucho tu idea, referencias y visión. Entendemos juntos qué quieres comunicar.",
  },
  {
    num: "02",
    title: "DISEÑO",
    desc: "Creo una propuesta exclusiva pensada para tu cuerpo y composición anatómica.",
  },
  {
    num: "03",
    title: "SESIÓN",
    desc: "Ejecutamos el proyecto con la mejor técnica, higiene y atención al detalle.",
  },
  {
    num: "04",
    title: "RESULTADO",
    desc: "Una pieza que funciona, que fluye con tu cuerpo y que perdurará en el tiempo.",
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
      className="py-section px-5 md:px-8 lg:px-12 bg-surface"
    >
      <div className="max-w-container mx-auto">
        {/* Title */}
        <div className="reveal max-w-3xl mb-16 md:mb-24">
          <h2 className="font-display text-display-lg uppercase">
            EL TATUAJE<br />
            ES EL RESULTADO.<br />
            <span className="text-muted">EL PROCESO ES<br />DONDE EMPIEZA TODO.</span>
          </h2>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`reveal delay-${Math.min(i + 1, 4)} bg-surface p-8 md:p-10`}
            >
              {/* Number */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-display text-5xl md:text-6xl text-gold">{step.num}</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl md:text-2xl text-ink mb-4">
                {step.title}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="reveal delay-4 mt-16 md:mt-24 grid md:grid-cols-3 gap-10">
          <div>
            <p className="label-gold mb-3">CONCEPTUALIZACIÓN</p>
            <p className="text-muted text-sm leading-relaxed">
              Cada proyecto comienza con una conversación. Entender tu historia
              es el primer paso para crear algo único.
            </p>
          </div>
          <div>
            <p className="label-gold mb-3">ADAPTACIÓN ANATÓMICA</p>
            <p className="text-muted text-sm leading-relaxed">
              El diseño se adapta a las líneas naturales de tu cuerpo,
              no al revés.
            </p>
          </div>
          <div>
            <p className="label-gold mb-3">SEGUIMIENTO</p>
            <p className="text-muted text-sm leading-relaxed">
              El proceso no termina en la sesión. Te acompaño durante
              toda la cicatrización.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
