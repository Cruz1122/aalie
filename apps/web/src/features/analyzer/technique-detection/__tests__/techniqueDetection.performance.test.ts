import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import { detectTechniqueFromAst } from "../index";
import { parseSourceToAst } from "./parseSourceToAst";
import { TECHNIQUE_ORACLES } from "./techniqueDetection.oracles";

describe("technique detection performance", () => {
  it("runs fast on oracle set", () => {
    const asts = TECHNIQUE_ORACLES.map((oracle) =>
      parseSourceToAst(oracle.source),
    );

    const ROUNDS = 5;
    const t0 = performance.now();
    for (let round = 0; round < ROUNDS; round++) {
      for (const ast of asts) detectTechniqueFromAst(ast);
    }
    const elapsed = performance.now() - t0;

    const limitMs = TECHNIQUE_ORACLES.length * ROUNDS * 500;
    expect(elapsed).toBeLessThan(limitMs);
  });
});
