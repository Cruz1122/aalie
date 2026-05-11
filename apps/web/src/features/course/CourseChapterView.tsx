"use client";

import type { ContentChapterData } from "@/lib/content/types";

import { CourseModuleView } from "./CourseModuleView";

interface CourseChapterViewProps {
  data: ContentChapterData;
}

export function CourseChapterView({ data }: CourseChapterViewProps) {
  const filteredData: ContentChapterData = {
    ...data,
    module: {
      ...data.module,
      chapters: [data.chapter],
    },
    chapters: [data.chapterSummary],
    sectionSummaries: data.sectionSummaries.filter(
      (section) => section.chapterId === data.chapter.chapterId,
    ),
  };

  return <CourseModuleView data={filteredData} />;
}
