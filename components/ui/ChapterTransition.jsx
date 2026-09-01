"use client";

import { useExperience } from "@/context/ExperienceContext";
import { Star4, Star6, Splash } from "@/components/ui/EditorialDoodles";

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

  const isOdd = transitionData.chapter % 2 === 1;

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center grain">
      {/* Background splashes */}
      <div className="absolute top-1/4 -right-10 opacity-40">
        <Splash size={150} color={isOdd ? "gold" : "teal"} />
      </div>
      <div className="absolute bottom-1/4 -left-10 opacity-30">
        <Splash size={120} color={isOdd ? "teal" : "gold"} />
      </div>

      {/* Doodles */}
      <Star4 className="absolute top-1/3 left-8" size={28} color={isOdd ? "gold" : "teal"} />
      <Star6 className="absolute bottom-1/3 right-8" size={24} color={isOdd ? "teal" : "gold"} />

      {/* Content */}
      <div className="text-center relative">
        {/* Big number */}
        <span className={`font-gothic text-[120px] leading-none animate-fade-up ${
          isOdd ? "text-gold" : "text-teal"
        }`}>
          {chapter.number}
        </span>

        {/* Title */}
        <div className="mt-4 overflow-hidden">
          <p className="font-display text-2xl text-cream word-reveal stagger-2">
            {chapter.title}
          </p>
          <p className={`font-gothic text-poster-sm word-reveal stagger-3 ${
            isOdd ? "text-gold" : "text-teal"
          }`}>
            {chapter.highlight}
          </p>
        </div>

        {/* Sticker */}
        <div className={`sticker ${isOdd ? "" : "sticker-teal"} absolute -bottom-8 right-0`}>
          CHAPTER
        </div>
      </div>

      {/* Background word */}
      <div className="absolute bottom-20 -left-8 font-gothic text-[100px] text-cream/[0.02] select-none pointer-events-none -rotate-6">
        {chapter.highlight}
      </div>
    </div>
  );
}
