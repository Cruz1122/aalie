import assert from "node:assert";
import { describe, it } from "node:test";

import { buildDocumentModel } from "../renderers/document-model-builder";
import { renderMarkdownReport } from "../renderers/markdown";
import {
  createIterativeSnapshot,
  createRecursiveSnapshot,
} from "./fixtures/snapshot-fixtures";

describe("markdown-renderer", () => {
  it("renderiza secciones comunes en formato narrativo", () => {
    const snapshot = createIterativeSnapshot();
    const model = buildDocumentModel(snapshot);
    const markdown = renderMarkdownReport({ snapshot, documentModel: model });

    assert.match(markdown, /# Reporte Institucional AALIE/);
    assert.doesNotMatch(markdown, /Advertencia Institucional/);
    assert.match(markdown, /snapshotId:/);
    assert.match(markdown, /Pseudocodigo Analizado/);
    assert.match(markdown, /Desarrollo Del Analisis/);
  });

  it("renderiza seccion recursiva por metodo", () => {
    const snapshot = createRecursiveSnapshot("master");
    const model = buildDocumentModel(snapshot);
    const markdown = renderMarkdownReport({ snapshot, documentModel: model });

    assert.match(markdown, /Recursive Analysis Step By Step/);
    assert.match(markdown, /Selected method: Master Theorem/);
    assert.match(markdown, /T\(n\)=2T\(n\/2\)\+n/);
  });
});
