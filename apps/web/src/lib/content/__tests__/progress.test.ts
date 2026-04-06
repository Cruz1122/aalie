import { beforeEach, describe, expect, it } from "vitest";

import {
  computeModuleProgress,
  computeSpaceProgress,
  CONTENT_PROGRESS_STORAGE_KEY,
  getCompletedSectionIds,
  markSectionCompleted,
} from "@/lib/content/progress";
import type { ContentModuleSummary } from "@/lib/content/types";

const guideModules: ContentModuleSummary[] = [
  {
    moduleId: "mod-introduccion",
    slug: "introduccion",
    title: "Introducción",
    summary: "Resumen",
    tags: [],
    order: 1,
    route: "/user-guide/introduccion",
    totalSections: 2,
    totalTrackableSections: 2,
  },
  {
    moduleId: "mod-sintaxis-de-la-gramatica",
    slug: "sintaxis-de-la-gramatica",
    title: "Sintaxis",
    summary: "Resumen",
    tags: [],
    order: 2,
    route: "/user-guide/sintaxis-de-la-gramatica",
    totalSections: 6,
    totalTrackableSections: 6,
  },
];

describe("content progress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores completed sections by stable spaceId/moduleId/sectionId keys", () => {
    markSectionCompleted("user-guide", "mod-introduccion", "sec-panorama-general");
    markSectionCompleted("user-guide", "mod-introduccion", "sec-panorama-general");
    markSectionCompleted(
      "user-guide",
      "mod-introduccion",
      "sec-navegacion-y-siguientes-pasos",
    );

    expect(
      Array.from(
        getCompletedSectionIds("user-guide", "mod-introduccion"),
      ),
    ).toEqual([
      "sec-navegacion-y-siguientes-pasos",
      "sec-panorama-general",
    ]);

    expect(window.localStorage.getItem(CONTENT_PROGRESS_STORAGE_KEY)).toContain(
      "mod-introduccion",
    );
  });

  it("computes module progress from completed trackable sections", () => {
    markSectionCompleted("user-guide", "mod-sintaxis-de-la-gramatica", "sec-call");
    markSectionCompleted(
      "user-guide",
      "mod-sintaxis-de-la-gramatica",
      "sec-control",
    );
    markSectionCompleted(
      "user-guide",
      "mod-sintaxis-de-la-gramatica",
      "sec-operadores",
    );

    const progress = computeModuleProgress(
      guideModules[1],
      getCompletedSectionIds("user-guide", "mod-sintaxis-de-la-gramatica"),
    );

    expect(progress).toBe(50);
  });

  it("computes space progress across all published guide modules", () => {
    markSectionCompleted("user-guide", "mod-introduccion", "sec-panorama-general");
    markSectionCompleted("user-guide", "mod-introduccion", "sec-navegacion");
    markSectionCompleted("user-guide", "mod-sintaxis-de-la-gramatica", "sec-call");
    markSectionCompleted(
      "user-guide",
      "mod-sintaxis-de-la-gramatica",
      "sec-asignacion",
    );

    expect(computeSpaceProgress("user-guide", guideModules)).toBe(50);
  });

  it("preserves progress across locales because locale is not part of the key", () => {
    markSectionCompleted("user-guide", "mod-introduccion", "sec-panorama-general");

    const spanishProgress = computeModuleProgress(
      guideModules[0],
      getCompletedSectionIds("user-guide", "mod-introduccion"),
    );
    const englishProgress = computeModuleProgress(
      {
        ...guideModules[0],
        title: "Introduction",
        route: "/user-guide/introduction",
      },
      getCompletedSectionIds("user-guide", "mod-introduccion"),
    );

    expect(spanishProgress).toBe(50);
    expect(englishProgress).toBe(50);
  });
});
