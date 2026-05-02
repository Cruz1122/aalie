"use client";

import { ContentTableOfContents } from "@/components/content/ContentTableOfContents";
import type {
  ContentChapterSummary,
  ContentSectionSummary,
} from "@/lib/content/types";

interface CourseSidebarProps {
  chapters: ContentChapterSummary[];
  sections: ContentSectionSummary[];
  activeSectionId?: string;
  completedSectionIds?: string[];
}

export function CourseSidebar({
  chapters,
  sections,
  activeSectionId,
  completedSectionIds,
}: CourseSidebarProps) {
  return (
    <div className="space-y-4">
      <aside className="glass-card rounded-2xl border border-white/10 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Chapters
        </div>
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <a
              key={chapter.chapterId}
              href={`#${chapter.slug}`}
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              {chapter.title}
            </a>
          ))}
        </div>
      </aside>
      <ContentTableOfContents
        sections={sections}
        activeSectionId={activeSectionId}
        completedSectionIds={completedSectionIds}
      />
    </div>
  );
}
