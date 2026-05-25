import { describe, it, expect } from "vitest";

import {
  LEGACY_CATEGORY_REDIRECTS,
  EXAMPLE_CATEGORY_ORDER,
  EXAMPLE_CATEGORY_META,
  getCategoryBySlug,
} from "@/lib/examples/catalog";

describe("Legacy category redirects", () => {
  const redirects = LEGACY_CATEGORY_REDIRECTS;

  it("maps legacy Spanish slugs to English canonical slugs", () => {
    expect(redirects.iterativos).toBe("iterative");
    expect(redirects["divide-y-venceras"]).toBe("divide-and-conquer");
    expect(redirects["resta-y-venceras"]).toBe("decrease-and-conquer");
    expect(redirects["resta-y-seras-vencido"]).toBe(
      "decrease-and-get-conquered",
    );
  });

  it("maps recursive-expansion legacy slug", () => {
    expect(redirects["recursive-expansion"]).toBe("decrease-and-get-conquered");
  });

  it("all targets are valid canonical slugs", () => {
    for (const target of Object.values(redirects)) {
      expect(getCategoryBySlug(target)).toBeDefined();
    }
  });
});

describe("getCategoryBySlug", () => {
  it("resolves all canonical slugs", () => {
    const slugs = EXAMPLE_CATEGORY_ORDER.map(
      (category) => EXAMPLE_CATEGORY_META[category].slug,
    );
    for (const slug of slugs) {
      const category = getCategoryBySlug(slug);
      expect(category).toBeDefined();
      expect(EXAMPLE_CATEGORY_META[category!].slug).toBe(slug);
    }
  });

  it("returns undefined for unknown slugs", () => {
    expect(getCategoryBySlug("nonexistent")).toBeUndefined();
    expect(getCategoryBySlug("")).toBeUndefined();
    expect(getCategoryBySlug(" recursive ")).toBeUndefined();
  });
});

describe("Examples page searchParams", () => {
  function parsePageFromParams(searchParams: { page?: string } | null): number {
    const page = Number(searchParams?.page ?? "1");
    return isNaN(page) || page < 1 ? 1 : page;
  }

  it("parses page 1 from empty params", () => {
    expect(parsePageFromParams(null)).toBe(1);
    expect(parsePageFromParams({})).toBe(1);
    expect(parsePageFromParams({ page: undefined })).toBe(1);
  });

  it("parses page number from params", () => {
    expect(parsePageFromParams({ page: "1" })).toBe(1);
    expect(parsePageFromParams({ page: "3" })).toBe(3);
  });

  it("falls back to 1 for invalid page values", () => {
    expect(parsePageFromParams({ page: "0" })).toBe(1);
    expect(parsePageFromParams({ page: "-1" })).toBe(1);
    expect(parsePageFromParams({ page: "abc" })).toBe(1);
  });

  it("falls back to 1 for out-of-range page values", () => {
    expect(parsePageFromParams({ page: "999" })).toBe(999);
  });
});
