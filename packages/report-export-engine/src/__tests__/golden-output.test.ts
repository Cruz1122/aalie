import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

import { buildExportReport } from "../application/export-orchestrator";
import { compileLatexToPdf, isPdflatexAvailable } from "../infrastructure/pdf/latex-compiler";
import { buildTraceDiagramAssets } from "../application/trace-diagram-assets";
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
  assert.ok(existsSync(filePath), `Missing golden file: ${filePath}`);
  return readFileSync(filePath, "utf8");
}

async function regenerateAndReadGoldenPdf(
  filePath: string,
  latex: string,
  extraFiles: Array<{ relativePath: string; content: string | Buffer }> = [],
): Promise<Buffer | null> {
  if (!isPdflatexAvailable()) {
    return null;
  }
  assert.ok(existsSync(filePath), `Missing golden PDF: ${filePath}`);

  const compiled = compileLatexToPdf({
    texContent: latex,
    cleanup: true,
    jobName: "golden-report",
    extraFiles,
  });
  assert.ok(compiled.pdfBuffer.length > 1024, "compiled PDF should have meaningful size");
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
    it(`coincide con golden markdown/latex: ${testCase.name}`, async () => {
      const snapshot = testCase.snapshotFactory();
      const model = buildDocumentModel(snapshot);

      const markdown = renderMarkdownReport({ snapshot, documentModel: model });
      const latex = renderLatexReport({ snapshot, documentModel: model });
      const diagramAssets = await buildTraceDiagramAssets(model);

      const mdPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.md`);
      const texPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.tex`);
      const pdfPath = path.join(GOLDEN_DIR, `${testCase.name}.golden.pdf`);
      const snapshotPath = path.join(GOLDEN_DIR, `${testCase.name}.snapshot.json`);
      const manifestPath = path.join(GOLDEN_DIR, `${testCase.name}.manifest.json`);

      const expectedMd = ensureGoldenFile(mdPath, markdown);
      const expectedTex = ensureGoldenFile(texPath, latex);
      const expectedSnapshot = ensureGoldenFile(
        snapshotPath,
        JSON.stringify(snapshot, null, 2),
      );
      const zipReport = await buildExportReport({
        snapshot,
        formats: ["markdown", "latex"],
        includeSnapshotJson: true,
        includeZipBundle: true,
      });
      const zip = await JSZip.loadAsync(zipReport.bundle?.content || Buffer.alloc(0));
      const expectedManifest = ensureGoldenFile(
        manifestPath,
        JSON.stringify(
          {
            entries: Object.keys(zip.files),
            manifest: JSON.parse((await zip.file("manifest.json")?.async("string")) || "{}"),
          },
          null,
          2,
        ),
      );
      const expectedPdf = await regenerateAndReadGoldenPdf(
        pdfPath,
        latex,
        diagramAssets.map((asset) => ({
          relativePath: asset.filename,
          content: asset.content,
        })),
      );

      assert.strictEqual(markdown, expectedMd);
      assert.strictEqual(latex, expectedTex);
      assert.strictEqual(JSON.stringify(snapshot, null, 2), expectedSnapshot);
      assert.strictEqual(
        JSON.stringify(
          {
            entries: Object.keys(zip.files),
            manifest: JSON.parse((await zip.file("manifest.json")?.async("string")) || "{}"),
          },
          null,
          2,
        ),
        expectedManifest,
      );
      if (expectedPdf) {
        assert.ok(expectedPdf.length > 1024, "golden PDF should have meaningful size");
        assert.strictEqual(expectedPdf.subarray(0, 5).toString("utf8"), "%PDF-");
      }

      const criticalTokens = [
        snapshot.snapshotId,
        snapshot.contentHash,
        snapshot.globalResult.cases.worst?.big_theta || "",
      ].filter(Boolean);

      for (const token of criticalTokens) {
        assert.ok(markdown.includes(token), `markdown should include token '${token}'`);
        assert.ok(latex.includes(token), `latex should include token '${token}'`);
      }
    });
  }
});
