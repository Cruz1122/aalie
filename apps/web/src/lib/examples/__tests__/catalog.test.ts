import { parseSourceToAst } from "@/features/analyzer/technique-detection/__tests__/parseSourceToAst";
import {
  EXAMPLE_CATEGORY_META,
  EXAMPLE_CATEGORY_ORDER,
  examplesCatalog,
  filterByMethods,
  findExampleBySlug,
  getExampleCategoriesByPage,
  getEnabledExamples,
  getExamplesByCategory,
  getLocalizedExampleSource,
  searchExamples,
  sortByLocalizedTitle,
  type ExampleCategory,
} from "@/lib/examples/catalog";

describe("examples catalog integrity", () => {
  it("has only valid categories", () => {
    for (const item of examplesCatalog) {
      expect(EXAMPLE_CATEGORY_ORDER).toContain(item.category);
    }
  });

  it("has unique id and slug values", () => {
    const ids = examplesCatalog.map((item) => item.id);
    const slugs = examplesCatalog.map((item) => item.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps localized source code for every algorithm", () => {
    expect(
      examplesCatalog.every(
        (item) =>
          item.sourceCodeByLocale.es.trim().length > 0 &&
          item.sourceCodeByLocale.en.trim().length > 0,
      ),
    ).toBe(true);
  });

  it("has at least 6 enabled examples per category", () => {
    for (const category of EXAMPLE_CATEGORY_ORDER) {
      const count = examplesCatalog.filter(
        (item) => item.category === category && item.enabled,
      ).length;

      expect(count).toBeGreaterThanOrEqual(6);
    }
  });

  it("does not expose the removed branching-recursion category or slug", () => {
    const removedCategory = ["recursive", "expansion"].join("_");

    expect(EXAMPLE_CATEGORY_ORDER).not.toContain(
      removedCategory as ExampleCategory,
    );

    const slugs = EXAMPLE_CATEGORY_ORDER.map(
      (category) => EXAMPLE_CATEGORY_META[category].slug,
    );

    expect(slugs).not.toContain(["recursive", "expansion"].join("-"));
  });

  it("keeps technique badges and recursive methods separated", () => {
    for (const item of examplesCatalog) {
      for (const method of item.verifiedMethods) {
        expect(["TM", "IT", "AR", "EC"]).toContain(method);
      }

      expect(item.techniqueBadges.length).toBeGreaterThan(0);
    }
  });

  it("paginates categories in groups of three", () => {
    expect(getExampleCategoriesByPage(1)).toEqual([
      "iterative",
      "divide_and_conquer",
      "decrease_and_conquer",
    ]);

    expect(getExampleCategoriesByPage(2)).toEqual([
      "decrease_and_get_conquered",
      "dp_top_down",
      "dp_bottom_up",
    ]);

    expect(getExampleCategoriesByPage(3)).toEqual([
      "greedy",
      "backtracking",
      "branch_and_bound",
    ]);
  });

  it("does not put division, integer division, or modulo examples in decrease families", () => {
    const forbidden = /\b(DIV|MOD)\b|\/\s*[A-Za-z0-9_]+|\/\s*\d+/;

    for (const item of examplesCatalog) {
      if (
        item.category === "decrease_and_conquer" ||
        item.category === "decrease_and_get_conquered"
      ) {
        expect(item.sourceCodeByLocale.es).not.toMatch(forbidden);
        expect(item.sourceCodeByLocale.en).not.toMatch(forbidden);
      }
    }
  });

  it("parses every enabled example in both locales", () => {
    for (const item of examplesCatalog) {
      if (!item.enabled) continue;

      try {
        parseSourceToAst(item.sourceCodeByLocale.es);
      } catch (error) {
        throw new Error(`es:${item.slug}: ${String(error)}`);
      }

      try {
        parseSourceToAst(item.sourceCodeByLocale.en);
      } catch (error) {
        throw new Error(`en:${item.slug}: ${String(error)}`);
      }
    }
  });

  it("sorts alphabetically by localized title", () => {
    const sortedEs = sortByLocalizedTitle(getEnabledExamples(), "es");
    const sortedEn = sortByLocalizedTitle(getEnabledExamples(), "en");

    const esTitles = sortedEs.map((item) => item.copy.es.title);
    const enTitles = sortedEn.map((item) => item.copy.en.title);

    const esSorted = [...esTitles].sort((a, b) => a.localeCompare(b, "es"));
    const enSorted = [...enTitles].sort((a, b) => a.localeCompare(b, "en"));

    expect(esTitles).toEqual(esSorted);
    expect(enTitles).toEqual(enSorted);
  });

  it("supports global search", () => {
    const enabled = getEnabledExamples();
    const result = searchExamples(enabled, "es", "fibonacci");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((item) => item.slug === "fibonacci-recursivo")).toBe(
      true,
    );
  });

  it("supports recursive OR method filtering", () => {
    const recursive = getExamplesByCategory("decrease_and_get_conquered", {
      enabledOnly: true,
      locale: "es",
    });
    const filtered = filterByMethods(recursive, ["EC", "TM"]);

    expect(filtered.length).toBeGreaterThan(0);
    for (const item of filtered) {
      expect(
        item.verifiedMethods.includes("EC") ||
          item.verifiedMethods.includes("TM"),
      ).toBe(true);
    }
  });

  it("returns the source code localized to english", () => {
    const example = findExampleBySlug("binary-search-recursiva");

    expect(example).toBeDefined();
    expect(getLocalizedExampleSource(example!, "en")).toContain("start");
    expect(getLocalizedExampleSource(example!, "en")).toContain("middle");
  });
});
