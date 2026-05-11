import type { ContentRef } from "@aa/types";

import courseContentRefSlugMap from "./generated/courseContentRefSlugMap.json";

export type CourseContentRefSlugEntry = {
  moduleSlug: string;
  chapters: Record<string, string>;
};

export type CourseContentRefSlugMap = Record<string, CourseContentRefSlugEntry>;

const slugMap = courseContentRefSlugMap as CourseContentRefSlugMap;

/**
 * Resuelve `module.slug` y `chapter.slug` del catálogo a partir de IDs estables
 * (`moduleId`, `chapterId`) usados en `contentRefs` de quizzes.
 *
 * Solo aplica al curso lógico `ada` (space `course` en catálogo). El mapa se
 * genera desde `packages/content-catalog/catalog/spaces/course/es/modules`.
 */
export function getCourseChapterPathFromContentRef(
  ref: Pick<ContentRef, "courseId" | "moduleId" | "chapterId">,
): { moduleSlug: string; chapterSlug: string } | null {
  if (ref.courseId !== "ada") {
    return null;
  }

  const moduleEntry = slugMap[ref.moduleId];
  if (!moduleEntry) {
    return null;
  }

  const chapterSlug = moduleEntry.chapters[ref.chapterId];
  if (!chapterSlug) {
    return null;
  }

  return {
    moduleSlug: moduleEntry.moduleSlug,
    chapterSlug,
  };
}

/**
 * Ruta pathname sin prefijo de locale (válida con `Link` de `@/i18n/navigation`).
 */
export function getCourseChapterHrefFromContentRef(
  ref: Pick<ContentRef, "courseId" | "moduleId" | "chapterId" | "blockId">,
): string | null {
  const path = getCourseChapterPathFromContentRef(ref);
  if (!path) {
    return null;
  }

  const anchor = ref.blockId ? `#${ref.blockId}` : "";
  return `/course/${path.moduleSlug}/${path.chapterSlug}${anchor}`;
}
