import { writeFileSync } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

import { buildExportReport } from "../application/export-orchestrator";
import {
  createHybridSnapshot,
  createIterativeSnapshot,
  createRecursiveSnapshot,
} from "../__tests__/fixtures/snapshot-fixtures";

const GOLDEN_DIR = path.resolve("./src/__tests__/fixtures/golden");

const goldenCases = [
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
] as const;

async function main(): Promise<void> {
  for (const testCase of goldenCases) {
    const snapshot = testCase.snapshotFactory();
    const report = await buildExportReport({
      snapshot,
      formats: ["markdown", "latex"],
      includeSnapshotJson: true,
      includeZipBundle: true,
    });
    const markdown = String(
      report.artifacts.find((artifact) => artifact.filename === "report.md")?.content || "",
    );
    const latex = String(
      report.artifacts.find((artifact) => artifact.filename === "report.tex")?.content || "",
    );

    writeFileSync(path.join(GOLDEN_DIR, `${testCase.name}.golden.md`), markdown, "utf8");
    writeFileSync(path.join(GOLDEN_DIR, `${testCase.name}.golden.tex`), latex, "utf8");
    writeFileSync(
      path.join(GOLDEN_DIR, `${testCase.name}.snapshot.json`),
      JSON.stringify(snapshot, null, 2),
      "utf8",
    );

    const zip = await JSZip.loadAsync(report.bundle?.content || Buffer.alloc(0));
    const entries = Object.keys(zip.files);
    const manifest = JSON.parse(
      (await zip.file("manifest.json")?.async("string")) || "{}",
    );
    writeFileSync(
      path.join(GOLDEN_DIR, `${testCase.name}.manifest.json`),
      JSON.stringify(
        {
          entries,
          manifest,
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  console.log("Golden markdown/latex/snapshot/manifest refreshed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
