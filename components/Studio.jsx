"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

export default function Studio() {
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
      id="estudio"
      className="py-section px-5 md:px-8 lg:px-12 bg-bg"
    >
      <div className="max-w-container mx-auto">
        {/* Header */}
        <div className="reveal mb-12 md:mb-20">
          <p className="label-gold mb-4">03 / THE STUDIO</p>
          <h2 className="font-display text-display-lg uppercase">
            UN ESPACIO<br />
            <span className="text-muted">PARA CREAR.</span>
          </h2>
        </div>

        {/* Studio Gallery - Editorial Collage */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {/* Large Image */}
          <div className="reveal delay-1 md:col-span-2 md:row-span-2 relative aspect-[4/3] md:aspect-auto overflow-hidden">
            <Image
              src="/images/about.jpg"
              alt="Crisbo Tattoo Studio - Espacio principal"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover editorial-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-transparent" />

            {/* Studio Name Overlay */}
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
              <p className="font-display text-3xl md:text-4xl text-ink">CRISBO</p>
              <p className="label text-ink/70">TATTOO STUDIO</p>
            </div>
          </div>

          {/* Small Image 1 */}
          <div className="reveal delay-2 relative aspect-square overflow-hidden">
            <Image
              src="/images/sp-black-grey.jpg"
              alt="Estación de trabajo"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover editorial-image"
            />
            <div className="absolute inset-0 bg-bg/10" />
          </div>

          {/* Small Image 2 */}
          <div className="reveal delay-3 relative aspect-square overflow-hidden">
            <Image
              src="/images/sp-realismo.jpg"
              alt="Ambiente del estudio"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover editorial-image"
            />
            <div className="absolute inset-0 bg-bg/10" />
          </div>
        </div>

        {/* Studio Info */}
        <div className="reveal delay-4 mt-12 md:mt-20 grid md:grid-cols-2 gap-12 items-start">
          {/* Left - Location */}
          <div>
            <div className="flex items-start gap-4">
              <MapPin size={20} className="text-gold flex-shrink-0 mt-1" />
              <div>
                <p className="font-display text-2xl md:text-3xl text-ink">Crisbo Tattoo Studio</p>
                <p className="text-muted mt-2">
                  Colina Campestre<br />
                  Bogotá, Colombia
                </p>
                <p className="text-muted text-sm mt-4">
                  Cl. 137b #57b - 39, piso 2
                </p>
              </div>
            </div>

            <a
              href="https://share.google/qeywmW0E0sMJvThim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm tracking-wider text-ink hover:text-gold transition-colors group"
            >
              VER EN GOOGLE MAPS
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right - Description */}
          <div>
            <p className="text-muted leading-relaxed">
              Espacio privado preparado para desarrollar cada proyecto con tranquilidad,
              comodidad y atención personalizada.
            </p>
            <p className="text-muted leading-relaxed mt-4">
              Un ambiente pensado para que te sientas cómodo durante todo el proceso,
              con los más altos estándares de higiene y equipos profesionales.
            </p>

            {/* Hours */}
            <div className="mt-8 pt-6 border-t border-line">
              <p className="label mb-2">HORARIO</p>
              <p className="text-ink">Lunes a Sábado</p>
              <p className="text-muted text-sm">10:00 a.m. - 7:00 p.m.</p>
              <p className="text-muted text-xs mt-2">Solo con cita previa</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
