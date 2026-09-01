"use client";

import { useExperience } from "@/context/ExperienceContext";

export default function ProgressBar({ className = "" }) {
  const { state, totalChapters } = useExperience();
  const { currentChapter } = state;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="label-number">
        {String(currentChapter + 1).padStart(2, "0")}
      </span>
      <span className="text-cement text-xs">/</span>
      <span className="label text-cement">
        {String(totalChapters).padStart(2, "0")}
      </span>

      <div className="flex gap-1 ml-3">
        {Array.from({ length: totalChapters }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm transition-all duration-300 ${
              i < currentChapter
                ? "bg-gold"
                : i === currentChapter
                ? "bg-gold shadow-[0_0_8px_rgba(245,196,0,0.5)]"
                : "bg-line-light"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
