"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, Splash, WavyLine } from "@/components/ui/EditorialDoodles";

const categories = [
  {
    id: "blackgrey",
    title: "BLACK & GREY",
    count: 24,
    image: "/images/sp-black-grey.jpg",
    accent: "gold",
  },
  {
    id: "realismo",
    title: "REALISMO",
    count: 18,
    image: "/images/sp-realismo.jpg",
    accent: "teal",
  },
  {
    id: "mangas",
    title: "MANGAS",
    count: 12,
    image: "/images/hero-tattoo.jpg",
    accent: "gold",
  },
  {
    id: "blackwork",
    title: "BLACKWORK",
    count: 15,
    image: "/images/sp-blackwork.jpg",
    accent: "teal",
  },
  {
    id: "coverup",
    title: "COVER UPS",
    count: 8,
    image: "/images/sp-coverup.jpg",
    accent: "gold",
  },
  {
    id: "custom",
    title: "CUSTOM PROJECTS",
    count: 20,
    image: "/images/about.jpg",
    accent: "teal",
  },
];

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
    goToChapter(4);
  };

  // Vista de proyecto individual
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-bg grain">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-line">
          <div className="flex items-center justify-between h-14 px-5">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-cream"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-display">VOLVER</span>
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
          <div className="relative aspect-square photo-reveal">
            <Image
              src={selectedProject.image}
              alt={selectedProject.title}
              fill
              className="object-cover"
            />
            <div className="tape top-4 right-4 rotate-12" />
          </div>

          <div className="p-5">
            <h2 className="font-gothic text-poster-sm text-cream">
              {selectedProject.title}
            </h2>
            <p className="text-muted mt-1">{selectedProject.year}</p>

            <button
              onClick={startQuoteFromPortfolio}
              className="mt-8 btn-primary w-full"
            >
              QUIERO ALGO ASÍ
              <ArrowRight size={16} />
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
      <div className="min-h-screen bg-bg pt-14 pb-8 px-5 grain">
        {/* Back button */}
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-muted mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-display">CATEGORÍAS</span>
        </button>

        {/* Title - Gothic */}
        <div className="relative mb-6">
          <h2 className={`font-gothic text-poster-md ${category?.accent === "teal" ? "text-teal" : "text-gold"}`}>
            {category?.title}
          </h2>
          <Star4 className="absolute -right-2 top-0" size={24} color={category?.accent || "gold"} />
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-2 gap-3">
          {categoryProjects.map((project, i) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="relative aspect-square overflow-hidden group animate-fade-up torn-paper"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover group-active:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-display text-sm text-cream truncate">
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
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // Vista de categorías
  return (
    <div className="min-h-screen pt-14 pb-8 px-5 grain">
      {/* Background splash */}
      <div className="absolute top-20 -right-8 opacity-60">
        <Splash size={100} color="gold" />
      </div>

      {/* Back */}
      <button
        onClick={() => goToScreen("home")}
        className="flex items-center gap-2 text-muted mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-display">INICIO</span>
      </button>

      {/* Title - Gothic */}
      <div className="relative mb-8">
        <h1 className="font-gothic text-poster-md text-cream leading-[0.85]">
          <span className="word-reveal block">EXPLORA</span>
          <span className="word-reveal block text-gold stagger-2">MI TRABAJO.</span>
        </h1>
        <Star6 className="absolute -right-2 top-2" size={28} color="gold" />
      </div>

      {/* Sticker */}
      <div className="sticker absolute right-6 top-48 stagger-3">
        +500 WORKS
      </div>

      {/* Categories - Editorial cards */}
      <div className="space-y-3">
        {categories.map((category, i) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="w-full relative h-24 overflow-hidden text-left animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Background */}
            <Image
              src={category.image}
              alt={category.title}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 ${
              category.accent === "teal" ? "bg-teal/60" : "bg-gold/50"
            } mix-blend-multiply`} />
            <div className="absolute inset-0 bg-bg/50" />

            {/* Tape decoration */}
            {i % 3 === 0 && <div className="tape -top-1 left-8 -rotate-3" />}

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-between px-5">
              <div>
                <h3 className="font-gothic text-xl text-cream">{category.title}</h3>
                <p className="text-muted text-xs mt-1">{category.count} proyectos</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                category.accent === "teal" ? "bg-teal/30" : "bg-gold/30"
              }`}>
                <ArrowRight size={18} className="text-cream" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Decorative */}
      <div className="mt-6 flex justify-center">
        <WavyLine width={80} color="gold" />
      </div>
    </div>
  );
}
