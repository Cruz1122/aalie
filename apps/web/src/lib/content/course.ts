import "server-only";

import { getSpaceBundle, validateCatalog } from "@aa/content-catalog/server";
import type { LoadedSpaceBundle } from "@aa/content-catalog/types";
import { cache } from "react";

import {
  buildContentChapterDataFromBundle,
  buildContentLandingDataFromBundle,
  buildContentModuleDataFromBundle,
} from "./catalog-transform";

export const COURSE_SPACE_ID = "course";
export const COURSE_FALLBACK_LOCALE = "es";

const ensureValidCatalog = cache(() => {
  const report = validateCatalog();
  if (!report.valid) {
    throw new Error(
      `[catalog] Validation errors:\n${report.errors.map((e) => `  [${e.code}] ${e.message} (${e.path ?? "?"})`).join("\n")}`,
    );
  }
  return report;
});

function tryLoadCourseBundle(locale: string): LoadedSpaceBundle | null {
  try {
    return getSpaceBundle(COURSE_SPACE_ID, locale);
  } catch {
    return null;
  }
}

const loadCourseBundle = cache((locale: string): LoadedSpaceBundle => {
  ensureValidCatalog();
  return (
    tryLoadCourseBundle(locale) ??
    tryLoadCourseBundle(COURSE_FALLBACK_LOCALE) ??
    getSpaceBundle(COURSE_SPACE_ID, locale)
  );
});

export function getCourseLandingData(locale: string) {
  return buildContentLandingDataFromBundle(loadCourseBundle(locale));
}

export function getCourseModuleData(locale: string, moduleSlug: string) {
  return buildContentModuleDataFromBundle(loadCourseBundle(locale), moduleSlug);
}

export function getCourseChapterData(
  locale: string,
  moduleSlug: string,
  chapterSlug: string,
) {
  return buildContentChapterDataFromBundle(
    loadCourseBundle(locale),
    moduleSlug,
    chapterSlug,
  );
}

export function getCourseStaticParams(locales: readonly string[]) {
  const fallbackBundle = loadCourseBundle(COURSE_FALLBACK_LOCALE);

  return locales.flatMap((locale) =>
    (tryLoadCourseBundle(locale) ?? fallbackBundle).modules.map(
      ({ module }) => ({
        locale,
        moduleSlug: module.slug,
      }),
    ),
  );
}

export function getCourseChapterStaticParams(locales: readonly string[]) {
  const fallbackBundle = loadCourseBundle(COURSE_FALLBACK_LOCALE);

  return locales.flatMap((locale) =>
    (tryLoadCourseBundle(locale) ?? fallbackBundle).modules.flatMap(
      ({ module }) =>
        module.chapters.map((chapter) => ({
          locale,
          moduleSlug: module.slug,
          chapterSlug: chapter.slug,
        })),
    ),
  );
}
