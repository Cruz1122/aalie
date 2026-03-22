import assert from "node:assert";
import { describe, it } from "node:test";

import { buildExportReport } from "../application/export-orchestrator";
import {
  isPdflatexAvailable,
  LatexCompilationError,
} from "../infrastructure/pdf/latex-compiler";
import { createIterativeSnapshot } from "./fixtures/snapshot-fixtures";

describe("export-orchestrator", () => {
  it("genera markdown y latex desde el mismo snapshot", async () => {
    const snapshot = createIterativeSnapshot();
    const result = await buildExportReport({
      snapshot,
      formats: ["markdown", "latex"],
      includeSnapshotJson: true,
      includeZipBundle: false,
    });

    const markdown = result.artifacts.find((item) => item.format === "markdown");
    const latex = result.artifacts.find((item) => item.format === "latex");

    assert.ok(markdown);
    assert.ok(latex);

    const markdownContent = typeof markdown?.content === "string" ? markdown.content : "";
    const latexContent = typeof latex?.content === "string" ? latex.content : "";

    assert.match(markdownContent, new RegExp(snapshot.snapshotId));
    assert.match(latexContent, new RegExp(snapshot.snapshotId));
    assert.match(markdownContent, new RegExp(snapshot.contentHash));
    assert.match(latexContent, new RegExp(snapshot.contentHash));
  });

  it("falla en hard mode cuando se pide PDF sin compilador disponible", async () => {
    if (isPdflatexAvailable()) {
      return;
    }

    const snapshot = createIterativeSnapshot();
    await assert.rejects(
      async () =>
        buildExportReport({
          snapshot,
          formats: ["pdf"],
          includeSnapshotJson: false,
          includeZipBundle: false,
        }),
      (error: unknown) =>
        error instanceof LatexCompilationError && error.kind === "compiler_missing",
    );
  });

  it("genera artefacto PDF cuando pdflatex está disponible", async () => {
    if (!isPdflatexAvailable()) {
      return;
    }

    const snapshot = createIterativeSnapshot();
    const result = await buildExportReport({
      snapshot,
      formats: ["pdf"],
      includeSnapshotJson: false,
      includeZipBundle: false,
    });

    const pdf = result.artifacts.find((item) => item.format === "pdf");
    assert.ok(pdf, "PDF artifact should be present");
    assert.strictEqual(pdf?.mimeType, "application/pdf");
    assert.ok(Buffer.isBuffer(pdf?.content), "PDF content should be a Buffer");
    if (!pdf || !Buffer.isBuffer(pdf.content)) {
      assert.fail("PDF artifact content is not a Buffer");
    }
    assert.ok(pdf.content.length > 1024, "PDF should not be empty");
    assert.strictEqual(pdf.content.subarray(0, 5).toString("utf8"), "%PDF-");
  });
});
