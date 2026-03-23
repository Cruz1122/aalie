import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AnalyzeOpenResponse } from "@aa/types";

import { buildExportReport } from "../application/export-orchestrator";
import { buildSnapshot } from "../domain/snapshot-builder";

function sampleCase(caseTheta: string): AnalyzeOpenResponse {
  return {
    ok: true,
    byLine: [
      {
        line: 1,
        kind: "for",
        ck: "C_1",
        count: "n",
        count_raw: "\\sum_{i=1}^{n} 1",
        note: "sample",
      },
    ],
    totals: {
      T_open: "C_1 n + C_0",
      T_polynomial: "C_1 n + C_0",
      big_o: "O(n)",
      big_omega: "\\Omega(n)",
      big_theta: caseTheta,
      procedure: ["Identificar costo por linea", "Cerrar sumatorias"],
      notes: ["Caso de ejemplo"],
    },
  };
}

async function main(): Promise<void> {
  const snapshot = buildSnapshot({
    source: "linear(A, n) BEGIN FOR i <- 1 TO n DO PRINT A[i]; END",
    locale: "es",
    analysisId: "example-analysis",
    parse: {
      ok: true,
      available: true,
      runtime: "python",
      ast: {
        type: "Program",
        pos: { line: 1, column: 1 },
        body: [],
      },
      errors: [],
    },
    classify: { kind: "iterative", method: "ast" },
    analyze: {
      ok: true,
      has_case_variability: false,
      worst: sampleCase("\\Theta(n)"),
      best: "same_as_worst",
      avg: "same_as_worst",
    },
    traceByCase: {},
  });

  const result = await buildExportReport({
    snapshot,
    formats: ["markdown", "latex"],
    includeSnapshotJson: true,
    includeZipBundle: true,
  });

  const outputDir = path.resolve(process.cwd(), "tmp-export-example");
  mkdirSync(outputDir, { recursive: true });

  for (const artifact of result.artifacts) {
    const destination = path.join(outputDir, artifact.filename);
    if (typeof artifact.content === "string") {
      writeFileSync(destination, artifact.content, "utf8");
    } else {
      writeFileSync(destination, artifact.content);
    }
  }

  if (result.bundle) {
    writeFileSync(path.join(outputDir, result.bundle.filename), result.bundle.content);
  }
}

void main();
