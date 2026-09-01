"use client";

import { useExperience } from "@/context/ExperienceContext";

const chapterTitles = [
  null, // 0 - no transition
  { number: "01", title: "CONOCE AL", highlight: "ARTISTA" },
  { number: "02", title: "MI", highlight: "FILOSOFÍA" },
  { number: "03", title: "CONOCE EL", highlight: "ESTUDIO" },
  { number: "04", title: "HABLEMOS", highlight: "DE TI" },
  { number: "05", title: "TU", highlight: "CUERPO" },
  { number: "06", title: "EL", highlight: "TAMAÑO" },
  { number: "07", title: "LA", highlight: "ENERGÍA" },
  { number: "08", title: "TU", highlight: "PROYECTO" },
  { number: "09", title: "EL SIGUIENTE", highlight: "PASO" },
];

export default function ChapterTransition() {
  const { state } = useExperience();
  const { showChapterTransition, transitionData } = state;

  if (!showChapterTransition || !transitionData) return null;

  const chapter = chapterTitles[transitionData.chapter];
  if (!chapter) return null;

  return (
    <div className="chapter-transition grain">
      <div className="text-center">
        <span className="font-display text-6xl text-gold animate-fade-in">
          {chapter.number}
        </span>
        <div className="mt-4 overflow-hidden">
          <p className="font-display text-2xl text-ink animate-fade-in-up stagger-2">
            {chapter.title}
          </p>
          <p className="font-display text-2xl text-gold animate-fade-in-up stagger-3">
            {chapter.highlight}
          </p>
        </div>
      </div>
    </div>
  );
}
