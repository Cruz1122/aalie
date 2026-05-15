import { describe, expect, it } from "vitest";

import {
  examplesCatalog,
  getEnabledExamples,
} from "@/lib/examples/catalog";

import { detectTechniqueFromAst } from "../index";
import { parseSourceToAst } from "./parseSourceToAst";

const LOCALES = ["es", "en"] as const;

describe("catalog technique detection", () => {
  const enabled = getEnabledExamples(examplesCatalog);

  it("has enabled examples", () => {
    expect(enabled.length).toBeGreaterThan(0);
  });

  for (const locale of LOCALES) {
    it.each(enabled)(`$slug → $expectedTechnique (${locale})`, (example) => {
      const source = example.sourceCodeByLocale[locale];

      expect(
        source?.trim(),
        `${example.slug} is missing ${locale} source`,
      ).toBeTruthy();

      const ast = parseSourceToAst(source);
      const result = detectTechniqueFromAst(ast);

      expect(result.technique).toBe(example.expectedTechnique);
    });
  }
});
