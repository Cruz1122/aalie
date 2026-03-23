import assert from "node:assert";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { compileLatexToPdf, isPdflatexAvailable } from "../infrastructure/pdf/latex-compiler";
import { buildDocumentModel } from "../renderers/document-model-builder";
import { renderLatexReport } from "../renderers/latex";
import { renderMarkdownReport } from "../renderers/markdown";
import {
  createHybridSnapshot,
  createIterativeSnapshot,
  createRecursiveSnapshot,
} from "./fixtures/snapshot-fixtures";

interface GoldenCase {
  name: string;
  snapshotFactory: () => ReturnType<typeof createIterativeSnapshot>;
}

const GOLDEN_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/golden",
);

function ensureGoldenFile(filePath: string, content: string): string {
  if (!existsSync(GOLDEN_DIR)) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
  }
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, "utf8");
  }
  return readFileSync(filePath, "utf8");
}

function regenerateAndReadGoldenPdf(filePath: string, latex: string): Buffer | null {
  if (!isPdflatexAvailable()) {
    return null;
  }

  if (!existsSync(GOLDEN_DIR)) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
  }

  const compiled = compileLatexToPdf({
    texContent: latex,
    cleanup: true,
    jobName: "golden-report",
  });
  writeFileSync(filePath, compiled.pdfBuffer);
  return readFileSync(filePath);
}

const goldenCases: GoldenCase[] = [
  { name: "iterative", snapshotFactory: createIterativeSnapshot },
  { name: "recursive-master", snapshotFactory: () => createRecursiveSnapshot("master") },
  { name: "recursive-iteration", snapshotFactory: () => createRecursiveSnapshot("iteration") },
  {
    name: "recursive-recursion-tree",
    snapshotFactory: () => createRecursiveSnapshot("recursion_tree"),
  },
  {
    name: "recursive-characteristic-equation",
    snapshotFactory: () => createRecursiveSnapshot("characteristic_equation"),
  },
  { name: "hybrid", snapshotFactory: createHybridSnapshot },
];

describe("golden-output", () => {
  for (const testCase of goldenCases) {
    it(`coincide con golden markdown/latex: ${testCase.name}`, () => {
      const snapshot = testCase.snapshotFactory();
      const model = buildDocumentModel(snapshot);

      const markdown = renderMarkdownReport({ snapshot, documentModel: model });
      const latex = renderLatexReport({ snapshot, documentModel: model });

      const mdPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.md`);
      const texPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.tex`);
      const pdfPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.pdf`);

      const expectedMd = ensureGoldenFile(mdPath, markdown);
      const expectedTex = ensureGoldenFile(texPath, latex);
      const expectedPdf = regenerateAndReadGoldenPdf(pdfPath, latex);

      assert.strictEqual(markdown, expectedMd);
      assert.strictEqual(latex, expectedTex);
      if (expectedPdf) {
        assert.ok(expectedPdf.length > 1024, "golden PDF should have meaningful size");
        assert.strictEqual(expectedPdf.subarray(0, 5).toString("utf8"), "%PDF-");
      }

      const criticalTokens = [
        snapshot.snapshotId,
        snapshot.contentHash,
        snapshot.globalResult.cases.worst?.T_open || "",
        snapshot.globalResult.cases.worst?.big_theta || "",
      ].filter(Boolean);

      for (const token of criticalTokens) {
        assert.ok(markdown.includes(token), `markdown should include token '${token}'`);
        assert.ok(latex.includes(token), `latex should include token '${token}'`);
      }
    });
  }
});
