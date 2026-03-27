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

    assert.match(markdown, /^# factorial/m);
    assert.doesNotMatch(markdown, /Advertencia Institucional/);
    assert.match(markdown, /snapshotId:/);
    assert.match(markdown, /## factorial/);
    assert.match(markdown, /Invariante del Ciclo/);
    assert.match(markdown, /Análisis por Casos/);
    assert.match(markdown, /Seguimiento de Ejecución/);
  });

  it("ubica el invariante antes del analisis por casos y renderiza seguimiento en 3 capas una sola vez", () => {
    const snapshot = createIterativeSnapshot();
    const model = buildDocumentModel(snapshot);
    const markdown = renderMarkdownReport({ snapshot, documentModel: model });

    const invariantIndex = markdown.indexOf("## Invariante del Ciclo");
    const caseAnalysisIndex = markdown.indexOf("## Análisis por Casos");
    const traceSectionIndex = markdown.indexOf("## Seguimiento de Ejecución");
    assert.ok(invariantIndex >= 0);
    assert.ok(caseAnalysisIndex >= 0);
    assert.ok(traceSectionIndex >= 0);
    assert.ok(invariantIndex < caseAnalysisIndex);
    assert.ok(caseAnalysisIndex < traceSectionIndex);

    const traceSection = markdown.slice(traceSectionIndex);
    const layerOneMatches = traceSection.match(/### Capa 1: Resumen ejecutivo/g) || [];
    const layerTwoMatches = traceSection.match(/### Capa 2: Tabla cronológica pedagógica/g) || [];
    const layerThreeMatches = traceSection.match(/### Capa 3: Vista agrupada por estructura de control/g) || [];

    assert.strictEqual(layerOneMatches.length, 1);
    assert.strictEqual(layerTwoMatches.length, 1);
    assert.strictEqual(layerThreeMatches.length, 1);
    assert.match(traceSection, /Caso analizado en detalle: Peor caso\./);
  });

  it("renderiza seccion recursiva por metodo", () => {
    const snapshot = createRecursiveSnapshot("master");
    const model = buildDocumentModel(snapshot);
    const markdown = renderMarkdownReport({ snapshot, documentModel: model });

    assert.match(markdown, /Recursive Analysis Step By Step/);
    assert.match(markdown, /### Método seleccionado|### Selected method/);
    assert.match(markdown, /Master Theorem/);
    assert.match(markdown, /T\(n\)=2T\(n\/2\)\+n/);
    assert.match(markdown, /\*\*1\. Master Step 1\*\*/);
    assert.match(markdown, /\*Fixture summary for master step 1 Fixture concept for recurrence_detected\*/);
    assert.match(markdown, /Seguimiento de ejecución recursiva|Recursive execution trace tracking/);
    assert.match(markdown, /```mermaid/);
    assert.match(markdown, /flowchart LR/);
  });
});
