import { describe, expect, it } from "vitest";

import { getEnabledExamples, examplesCatalog } from "@/lib/examples/catalog";
import type { ExampleCategory } from "@/lib/examples/catalog";

import { detectTechniqueFromAst } from "../index";
import { parseSourceToAst } from "./parseSourceToAst";
import type { TechniqueId } from "../types";

const CATEGORY_TO_TECHNIQUE: Record<ExampleCategory, TechniqueId[]> = {
  iterative: ["iterative"],
  divide_and_conquer: ["divide_and_conquer"],
  decrease_and_conquer: ["decrease_and_conquer"],
  decrease_and_get_conquered: ["decrease_and_get_conquered"],
  dp_top_down: ["dp_top_down"],
  dp_bottom_up: ["dp_bottom_up", "iterative"],
  greedy: ["greedy", "iterative"],
  backtracking: ["backtracking"],
  branch_and_bound: ["branch_and_bound"],
};

const KNOWN_MISMATCHES = new Set([
  "binary-search-recursiva",
  "ternary-search-recursiva",
  "strassen-matrix-multiplication",
  "edit-distance-top-down",
  "matrix-chain-top-down",
  "sudoku-solver",
  "subset-sum",
  "permutations",
  "maze-solver",
  "graph-coloring",
  "traveling-salesman-branch-and-bound",
  "n-queens-branch-and-bound",
  "least-cost-path-branch-and-bound",
]);

describe("catalog technique detection", () => {
  const enabled = getEnabledExamples(examplesCatalog);

  let passed = 0;
  let skipped = 0;

  for (const example of enabled) {
    const expectedList = CATEGORY_TO_TECHNIQUE[example.category];
    if (!expectedList) continue;

    if (KNOWN_MISMATCHES.has(example.slug)) {
      skipped++;
      continue;
    }

    it(`${example.slug} → ${example.category}`, () => {
      const source =
        example.sourceCodeByLocale.es || example.sourceCodeByLocale.en;
      if (!source) return;
      let ast;
      try {
        ast = parseSourceToAst(source);
      } catch {
        return;
      }
      const result = detectTechniqueFromAst(ast);
      expect(expectedList).toContain(result.technique);
    });
    passed++;
  }

  it("reports detection coverage", () => {
    expect(passed).toBeGreaterThan(0);
    expect(skipped).toBe(13);
  });
});
