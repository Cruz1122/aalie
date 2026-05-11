import { describe, expect, it } from "vitest";

import {
  getCourseChapterHrefFromContentRef,
  getCourseChapterPathFromContentRef,
} from "../resolveCourseContentRef";

describe("resolveCourseContentRef", () => {
  it("resolves catalog slugs from stable moduleId/chapterId (English URL slugs)", () => {
    const path = getCourseChapterPathFromContentRef({
      courseId: "ada",
      moduleId: "mod-complejidad-temporal-espacial",
      chapterId: "cap-complejidad-temporal-espacial",
    });
    expect(path).toEqual({
      moduleSlug: "time-and-space-complexity",
      chapterSlug: "time-and-space-complexity",
    });
  });

  it("resolves dynamic programming part chapter slugs", () => {
    const href = getCourseChapterHrefFromContentRef({
      courseId: "ada",
      moduleId: "mod-programacion-dinamica",
      chapterId: "cap-programacion-dinamica-parte-1",
      blockId: "blk-pd-intro-definicion",
    });
    expect(href).toBe(
      "/course/dynamic-programming/dynamic-programming-part-1#blk-pd-intro-definicion",
    );
  });

  it("returns null for unknown courseId", () => {
    expect(
      getCourseChapterPathFromContentRef({
        courseId: "other",
        moduleId: "mod-complejidad-temporal-espacial",
        chapterId: "cap-complejidad-temporal-espacial",
      }),
    ).toBeNull();
  });

  it("returns null for unknown moduleId", () => {
    expect(
      getCourseChapterPathFromContentRef({
        courseId: "ada",
        moduleId: "mod-unknown",
        chapterId: "cap-x",
      }),
    ).toBeNull();
  });
});
