import {
  EXAMPLE_CATEGORY_ORDER,
  examplesCatalog,
  filterByMethods,
  findExampleBySlug,
  getEnabledExamples,
  getExamplesByCategory,
  getLocalizedExampleSource,
  isRecursiveCategory,
  searchExamples,
  sortByLocalizedTitle,
} from "@/lib/examples/catalog";

describe("examples catalog integrity", () => {
  it("contains exactly 100 algorithms", () => {
    expect(examplesCatalog).toHaveLength(100);
  });

  it("contains 25 items per category", () => {
    for (const category of EXAMPLE_CATEGORY_ORDER) {
      expect(
        examplesCatalog.filter((item) => item.category === category),
      ).toHaveLength(25);
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

  it("keeps iterative examples without recursive badges", () => {
    const iterative = examplesCatalog.filter(
      (item) => item.category === "iterativos",
    );
    for (const item of iterative) {
      expect(item.verifiedMethods).toEqual([]);
    }
  });

  it("keeps recursive examples with valid badges only", () => {
    const valid = new Set(["TM", "IT", "AR", "EC"]);
    const recursive = examplesCatalog.filter((item) =>
      isRecursiveCategory(item.category),
    );

    for (const item of recursive) {
      for (const badge of item.verifiedMethods) {
        expect(valid.has(badge)).toBe(true);
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
    const recursive = getExamplesByCategory("resta-y-seras-vencido", {
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
    const example = findExampleBySlug("binary-search-iterativa");

    expect(example).toBeDefined();
    expect(getLocalizedExampleSource(example!, "en")).toContain("left <- 1;");
    expect(getLocalizedExampleSource(example!, "en")).toContain(
      "WHILE (left <= right) DO BEGIN",
    );
  });
});
