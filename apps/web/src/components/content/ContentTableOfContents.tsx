"use client";

import { useTranslations } from "next-intl";

import type { ContentSectionSummary } from "@/lib/content/types";

interface ContentTableOfContentsProps {
  sections: ContentSectionSummary[];
  activeSectionId?: string;
  completedSectionIds?: string[];
}

export function ContentTableOfContents({
  sections,
  activeSectionId,
  completedSectionIds = [],
}: ContentTableOfContentsProps) {
  const t = useTranslations("contentUi");
  const completed = new Set(completedSectionIds);
  const chapters = Array.from(
    sections
      .reduce(
        (acc, section) => {
          const key = `${section.chapterId}:${section.chapterSlug}`;
          const current = acc.get(key) ?? {
            chapterId: section.chapterId,
            chapterSlug: section.chapterSlug,
            chapterTitle: section.chapterTitle,
            sections: [] as ContentSectionSummary[],
          };
          current.sections.push(section);
          acc.set(key, current);
          return acc;
        },
        new Map<
          string,
          {
            chapterId: string;
            chapterSlug: string;
            chapterTitle: string;
            sections: ContentSectionSummary[];
          }
        >(),
      )
      .values(),
  );

  return (
    <aside className="glass-card sticky top-24 rounded-2xl border border-white/10 p-4">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {t("tableOfContents")}
      </div>
      <nav className="space-y-4" aria-label={t("tableOfContents")}>
        {chapters.map((chapter) => (
          <div
            key={chapter.chapterId}
            id={chapter.chapterSlug}
            className="space-y-2"
          >
            <a
              href={`#${chapter.chapterSlug}`}
              className="block text-sm font-semibold text-white transition-colors hover:text-sky-200"
            >
              {chapter.chapterTitle}
            </a>
            <ul className="space-y-1.5">
              {chapter.sections.map((section) => {
                const isActive = section.sectionId === activeSectionId;
                const isCompleted = completed.has(section.sectionId);
                return (
                  <li key={section.sectionId}>
                    <a
                      href={`#${section.slug}`}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-sky-500/15 text-sky-100"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                          isCompleted
                            ? "border-primary/45 bg-primary/15 text-sky-100"
                            : "border-white/10 bg-white/5 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : "•"}
                      </span>
                      <span className="min-w-0">{section.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
