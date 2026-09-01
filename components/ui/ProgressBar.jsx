"use client";

import { useExperience } from "@/context/ExperienceContext";

export default function ProgressBar({ className = "" }) {
  const { state, totalChapters } = useExperience();
  const { currentChapter } = state;

  // currentChapter es 1-based
  const progress = currentChapter;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Chapter number */}
      <span className="font-display text-gold text-sm">
        {String(progress).padStart(2, "0")}
      </span>
      <span className="text-cement text-xs">/</span>
      <span className="text-cement text-xs">
        {String(totalChapters).padStart(2, "0")}
      </span>

      {/* Progress dots */}
      <div className="flex gap-1 ml-2">
        {Array.from({ length: totalChapters }).map((_, i) => {
          const chapterNum = i + 1;
          const isCompleted = chapterNum < progress;
          const isCurrent = chapterNum === progress;
          const isPending = chapterNum > progress;

          return (
            <div
              key={i}
              className={`h-1.5 rounded-sm transition-all duration-300 ${
                isCompleted
                  ? "w-3 bg-gold"
                  : isCurrent
                  ? "w-4 bg-gold shadow-[0_0_8px_rgba(245,196,0,0.6)]"
                  : "w-2 bg-line-light"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
