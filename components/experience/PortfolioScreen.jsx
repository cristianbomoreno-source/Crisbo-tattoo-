"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { TitleReveal } from "@/components/ui/TextReveal";

const categories = [
  {
    id: "blackgrey",
    title: "BLACK & GREY",
    count: 24,
    image: "/images/sp-black-grey.jpg",
  },
  {
    id: "realismo",
    title: "REALISMO",
    count: 18,
    image: "/images/sp-realismo.jpg",
  },
  {
    id: "mangas",
    title: "MANGAS",
    count: 12,
    image: "/images/hero-tattoo.jpg",
  },
  {
    id: "blackwork",
    title: "BLACKWORK",
    count: 15,
    image: "/images/sp-blackwork.jpg",
  },
  {
    id: "coverup",
    title: "COVER UPS",
    count: 8,
    image: "/images/sp-coverup.jpg",
  },
  {
    id: "custom",
    title: "CUSTOM PROJECTS",
    count: 20,
    image: "/images/about.jpg",
  },
];

// Proyectos de ejemplo
const projects = {
  blackgrey: [
    { id: 1, title: "Full Sleeve", image: "/images/sp-black-grey.jpg", year: "2026" },
    { id: 2, title: "Retrato", image: "/images/sp-realismo.jpg", year: "2025" },
    { id: 3, title: "Composición", image: "/images/hero-tattoo.jpg", year: "2025" },
  ],
  realismo: [
    { id: 1, title: "Retrato Realista", image: "/images/sp-realismo.jpg", year: "2026" },
    { id: 2, title: "Wildlife", image: "/images/sp-black-grey.jpg", year: "2025" },
  ],
  mangas: [
    { id: 1, title: "Japanese Sleeve", image: "/images/hero-tattoo.jpg", year: "2026" },
  ],
  blackwork: [
    { id: 1, title: "Geométrico", image: "/images/sp-blackwork.jpg", year: "2025" },
  ],
  coverup: [
    { id: 1, title: "Cover Up", image: "/images/sp-coverup.jpg", year: "2024" },
  ],
  custom: [
    { id: 1, title: "Custom Project", image: "/images/about.jpg", year: "2026" },
  ],
};

export default function PortfolioScreen() {
  const { goToScreen, goToChapter } = useExperience();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const startQuoteFromPortfolio = () => {
    goToScreen("quote");
    goToChapter(4); // Saltar a "hablemos de ti"
  };

  // Vista de proyecto individual
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-line">
          <div className="flex items-center justify-between h-14 px-5">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-ink"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">VOLVER</span>
            </button>
            <button
              onClick={() => {
                setSelectedProject(null);
                setSelectedCategory(null);
              }}
              className="text-muted"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Project detail */}
        <div className="pt-14">
          <div className="relative aspect-square">
            <Image
              src={selectedProject.image}
              alt={selectedProject.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-5">
            <h2 className="font-display text-2xl text-ink">
              {selectedProject.title}
            </h2>
            <p className="text-muted mt-1">{selectedProject.year}</p>

            <button
              onClick={startQuoteFromPortfolio}
              className="mt-8 btn-primary w-full"
            >
              QUIERO ALGO ASÍ
              <ArrowRight size={16} className="arrow" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista de categoría
  if (selectedCategory) {
    const categoryProjects = projects[selectedCategory] || [];
    const category = categories.find((c) => c.id === selectedCategory);

    return (
      <div className="min-h-screen bg-bg pt-14 pb-8 px-5">
        {/* Back button */}
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-muted mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">CATEGORÍAS</span>
        </button>

        {/* Title */}
        <h2 className="font-display text-mobile-title text-gold mb-6">
          {category?.title}
        </h2>

        {/* Projects grid */}
        <div className="grid grid-cols-2 gap-3">
          {categoryProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover group-active:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-display text-sm text-ink truncate">
                  {project.title}
                </p>
                <p className="text-cement text-xs">{project.year}</p>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={startQuoteFromPortfolio}
          className="mt-8 btn-primary w-full"
        >
          QUIERO HACER ALGO ASÍ
          <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    );
  }

  // Vista de categorías
  return (
    <div className="min-h-screen pt-14 pb-8 px-5 grain">
      {/* Back */}
      <button
        onClick={() => goToScreen("home")}
        className="flex items-center gap-2 text-muted mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">INICIO</span>
      </button>

      {/* Title */}
      <TitleReveal
        className="text-mobile-title mb-8"
        lines={[
          { text: "EXPLORA" },
          { text: "MI TRABAJO.", gold: true },
        ]}
      />

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category, i) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="w-full relative h-28 rounded-lg overflow-hidden text-left animate-fade-in-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Background */}
            <Image
              src={category.image}
              alt={category.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-bg/60" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-between px-5">
              <div>
                <h3 className="font-display text-xl text-ink">{category.title}</h3>
                <p className="text-muted text-xs mt-1">{category.count} proyectos</p>
              </div>
              <ArrowRight size={20} className="text-ink/60" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
