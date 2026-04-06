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
    moduleId: "mod-user-guide-measure",
    slug: "como-se-mide-un-algoritmo",
    title: "Cómo se mide un algoritmo",
    summary: "Resumen",
    tags: [],
    order: 1,
    route: "/user-guide/como-se-mide-un-algoritmo",
    totalSections: 3,
    totalTrackableSections: 3,
  },
  {
    moduleId: "mod-user-guide-building-cost",
    slug: "como-se-construye-el-costo",
    title: "Cómo se construye el costo",
    summary: "Resumen",
    tags: [],
    order: 2,
    route: "/user-guide/como-se-construye-el-costo",
    totalSections: 2,
    totalTrackableSections: 2,
  },
];

describe("content progress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores completed sections by stable spaceId/moduleId/sectionId keys", () => {
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-que-es-eficiencia",
    );
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-que-es-eficiencia",
    );
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-operaciones-y-n",
    );

    expect(
      Array.from(
        getCompletedSectionIds("user-guide", "mod-user-guide-measure"),
      ),
    ).toEqual(["sec-operaciones-y-n", "sec-que-es-eficiencia"]);

    expect(window.localStorage.getItem(CONTENT_PROGRESS_STORAGE_KEY)).toContain(
      "mod-user-guide-measure",
    );
  });

  it("computes module progress from completed trackable sections", () => {
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-building-cost",
      "sec-suma-y-control",
    );

    const progress = computeModuleProgress(
      guideModules[1],
      getCompletedSectionIds("user-guide", "mod-user-guide-building-cost"),
    );

    expect(progress).toBe(50);
  });

  it("computes space progress across all published guide modules", () => {
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-que-es-eficiencia",
    );
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-operaciones-y-n",
    );
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-building-cost",
      "sec-suma-y-control",
    );

    expect(computeSpaceProgress("user-guide", guideModules)).toBe(60);
  });

  it("preserves progress across locales because locale is not part of the key", () => {
    markSectionCompleted(
      "user-guide",
      "mod-user-guide-measure",
      "sec-que-es-eficiencia",
    );

    const spanishProgress = computeModuleProgress(
      guideModules[0],
      getCompletedSectionIds("user-guide", "mod-user-guide-measure"),
    );
    const englishProgress = computeModuleProgress(
      {
        ...guideModules[0],
        title: "How an algorithm is measured",
        route: "/user-guide/measuring-an-algorithm",
      },
      getCompletedSectionIds("user-guide", "mod-user-guide-measure"),
    );

    expect(spanishProgress).toBe(33);
    expect(englishProgress).toBe(33);
  });
});
