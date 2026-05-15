import { describe, expect, it } from "vitest";

import {
  examplesCatalog,
  getEnabledExamples,
} from "@/lib/examples/catalog";

import { parseSourceToAst } from "@/features/analyzer/technique-detection/__tests__/parseSourceToAst";

const LOCALES = ["es", "en"] as const;

describe("examples catalog integrity", () => {
  const enabled = getEnabledExamples(examplesCatalog);

  it("has enabled examples", () => {
    expect(enabled.length).toBeGreaterThan(0);
  });

  it("has unique slugs", () => {
    const slugs = enabled.map((example) => example.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(enabled)("$slug has expectedTechnique", (example) => {
    expect(example.expectedTechnique).toBeTruthy();
  });

  it.each(enabled)("$slug has ES and EN source", (example) => {
    for (const locale of LOCALES) {
      expect(
        example.sourceCodeByLocale[locale]?.trim(),
        `${example.slug} is missing ${locale} source`,
      ).toBeTruthy();
    }
  });

  it.each(enabled)("$slug parses in ES and EN", (example) => {
    for (const locale of LOCALES) {
      const source = example.sourceCodeByLocale[locale];

      expect(
        () => parseSourceToAst(source),
        `${example.slug} does not parse in ${locale}`,
      ).not.toThrow();
    }
  });

  it.each(enabled.filter((example) => example.isTemplate))(
    "$slug has template metadata",
    (example) => {
      expect(example.templateOrder).toEqual(expect.any(Number));
      expect(example.copy.es.title.trim()).toBeTruthy();
      expect(example.copy.en.title.trim()).toBeTruthy();
    },
  );

  it("disabled examples have an explicit reason", () => {
    const disabled = examplesCatalog.filter((example) => !example.enabled);

    for (const example of disabled) {
      expect(
        example.disabledReason?.trim(),
        `${example.slug} is disabled without disabledReason`,
      ).toBeTruthy();
    }
  });
});
