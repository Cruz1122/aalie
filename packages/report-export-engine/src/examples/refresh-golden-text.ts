import { writeFileSync } from "node:fs";
import path from "node:path";

import { buildDocumentModel } from "../renderers/document-model-builder";
import { renderLatexReport } from "../renderers/latex";
import { renderMarkdownReport } from "../renderers/markdown";
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

for (const testCase of goldenCases) {
  const snapshot = testCase.snapshotFactory();
  const model = buildDocumentModel(snapshot);
  const markdown = renderMarkdownReport({ snapshot, documentModel: model });
  const latex = renderLatexReport({ snapshot, documentModel: model });

  writeFileSync(path.join(GOLDEN_DIR, `${testCase.name}.golden.md`), markdown, "utf8");
  writeFileSync(path.join(GOLDEN_DIR, `${testCase.name}.golden.tex`), latex, "utf8");
}

console.log("Golden markdown/latex refreshed.");
