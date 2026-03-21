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
});
