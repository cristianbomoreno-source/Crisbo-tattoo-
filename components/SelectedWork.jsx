"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const projects = [
  {
    id: "01",
    title: "FULL SLEEVE",
    style: "BLACK & GREY",
    location: "BOGOTA / 2026",
    image: "/images/sp-black-grey.jpg",
    size: "large",
  },
  {
    id: "02",
    title: "RETRATO REALISTA",
    style: "REALISM",
    location: "BOGOTA / 2025",
    image: "/images/sp-realismo.jpg",
    size: "medium",
  },
  {
    id: "03",
    title: "GEOMETRICO",
    style: "BLACKWORK",
    location: "BOGOTA / 2025",
    image: "/images/sp-blackwork.jpg",
    size: "medium",
  },
  {
    id: "04",
    title: "COVER UP",
    style: "BLACK & GREY",
    location: "BOGOTA / 2024",
    image: "/images/sp-coverup.jpg",
    size: "large",
  },
  {
    id: "05",
    title: "MANGA COMPLETA",
    style: "CUSTOM PROJECT",
    location: "BOGOTA / 2024",
    image: "/images/sp-granformato.jpg",
    size: "medium",
  },
  {
    id: "06",
    title: "DISENO PERSONALIZADO",
    style: "CUSTOM",
    location: "BOGOTA / 2024",
    image: "/images/sp-personalizado.jpg",
    size: "medium",
  },
];

export default function SelectedWork() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("visible"), i * 80);
            });
          }
        });
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="trabajos"
      className="py-20 md:py-32 lg:py-40 px-5 md:px-8 lg:px-12 bg-bg"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-20">
          <div className="reveal">
            <p className="label mb-4">02 / SELECTED WORK</p>
            <h2 className="font-display text-section uppercase leading-[0.9]">
              PROYECTOS<br />
              <span className="text-ink-muted">SELECCIONADOS.</span>
            </h2>
          </div>
          <a
            href="#"
            className="reveal delay-1 inline-flex items-center gap-2 text-sm tracking-wider text-ink hover:text-sage transition-colors group"
          >
            VER TODOS LOS PROYECTOS
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Projects Grid - Editorial Layout */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`reveal delay-${Math.min(i + 1, 4)} group relative overflow-hidden cursor-pointer ${
                project.size === "large" ? "md:col-span-2 aspect-[16/9]" : "aspect-[4/5]"
              }`}
            >
              {/* Image */}
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes={project.size === "large" ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-bg/20 group-hover:bg-bg/40 transition-colors duration-500" />

              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                {/* Top */}
                <div className="flex justify-between items-start">
                  <span className="font-display text-3xl md:text-4xl text-ink/80">{project.id}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight size={24} className="text-ink" />
                  </span>
                </div>

                {/* Bottom */}
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-display text-2xl md:text-3xl text-ink mb-2">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-3 text-ink-muted">
                    <span className="text-xs tracking-wider">{project.style}</span>
                    <span className="w-1 h-1 rounded-full bg-ink-muted" />
                    <span className="text-xs tracking-wider">{project.location}</span>
                  </div>
                </div>
              </div>

              {/* View Project - Mobile */}
              <div className="absolute bottom-6 right-6 md:hidden">
                <span className="text-xs tracking-wider text-ink bg-bg/60 px-3 py-2">
                  VER PROYECTO
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="reveal delay-4 mt-12 md:mt-16 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 border border-line text-ink text-sm tracking-wider px-8 py-4 hover:border-ink-muted transition-colors"
          >
            VER TODOS LOS PROYECTOS
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
