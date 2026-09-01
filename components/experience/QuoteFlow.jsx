"use client";

import { useExperience } from "@/context/ExperienceContext";
import Chapter01Artist from "./chapters/Chapter01Artist";
import Chapter02Philosophy from "./chapters/Chapter02Philosophy";
import Chapter03Studio from "./chapters/Chapter03Studio";
import Chapter04About from "./chapters/Chapter04About";
import Chapter05Body from "./chapters/Chapter05Body";
import Chapter06Size from "./chapters/Chapter06Size";
import Chapter07Style from "./chapters/Chapter07Style";
import Chapter08Summary from "./chapters/Chapter08Summary";
import Chapter09Final from "./chapters/Chapter09Final";
import ChapterTransition from "@/components/ui/ChapterTransition";

const chapters = {
  1: Chapter01Artist,
  2: Chapter02Philosophy,
  3: Chapter03Studio,
  4: Chapter04About,
  5: Chapter05Body,
  6: Chapter06Size,
  7: Chapter07Style,
  8: Chapter08Summary,
  9: Chapter09Final,
};

export default function QuoteFlow() {
  const { state } = useExperience();
  const { currentChapter, isTransitioning } = state;

  const CurrentChapter = chapters[currentChapter];

  return (
    <div className="min-h-screen pt-14">
      <ChapterTransition />

      {CurrentChapter && !isTransitioning && (
        <div className="screen-enter">
          <CurrentChapter />
        </div>
      )}
    </div>
  );
}
