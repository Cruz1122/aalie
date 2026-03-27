import assert from "node:assert";
import { describe, it } from "node:test";

import type { TraceGraphCanonical } from "@aa/types";

import { buildTraceDiagramLayout } from "../renderers/shared/trace-diagram-layout";
import { renderTraceDiagramMermaid } from "../renderers/shared/renderTraceDiagramMermaid";
import { renderTraceDiagramSvg } from "../infrastructure/diagram/renderTraceDiagramSvg";

function sampleGraph(): TraceGraphCanonical {
  return {
    nodes: [
      { id: "call_1", type: "default", position: { x: 0, y: 0 }, data: { label: "f(4)\n→ 24" } },
      { id: "call_2", type: "default", position: { x: 0, y: 0 }, data: { label: "f(3)\n→ 6" } },
      { id: "call_3", type: "default", position: { x: 0, y: 0 }, data: { label: "f(2)\n→ 2" } },
    ],
    edges: [
      { id: "e1", source: "call_1", target: "call_2", label: "", type: "smoothstep" },
      { id: "e2", source: "call_2", target: "call_3", label: "", type: "smoothstep" },
    ],
  };
}

describe("trace-diagram-rendering", () => {
  it("mantiene layout determinista para el mismo grafo", () => {
    const g = sampleGraph();
    const a = buildTraceDiagramLayout(g);
    const b = buildTraceDiagramLayout(g);

    assert.deepStrictEqual(a.graph, b.graph);
    assert.strictEqual(a.width, b.width);
    assert.strictEqual(a.height, b.height);
    assert.deepStrictEqual(a.stats, b.stats);
  });

  it("renderiza SVG y Mermaid con contenido esperado", () => {
    const g = sampleGraph();

    const svg = renderTraceDiagramSvg({
      graph: g,
      title: "Seguimiento de ejecución recursiva",
      caseName: "Peor caso",
      summary: { totalCalls: 3, maxRecursionDepth: 2 },
      diagnostics: { truncated: false },
    });
    assert.match(svg.svg, /<svg/);
    assert.match(svg.svg, /arrowhead/);
    assert.match(svg.svg, /Seguimiento de ejecución recursiva/);

    const mermaid = renderTraceDiagramMermaid({ graph: g });
    assert.match(mermaid.mermaid, /```mermaid/);
    assert.match(mermaid.mermaid, /flowchart LR/);
    assert.match(mermaid.mermaid, /call_1/);
  });

  it("aplica reducción visual cuando supera 60 nodos", () => {
    const largeGraph: TraceGraphCanonical = {
      nodes: Array.from({ length: 70 }, (_, index) => ({
        id: `call_${index + 1}`,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: `f(${index + 1})` },
      })),
      edges: Array.from({ length: 69 }, (_, index) => ({
        id: `e_${index + 1}`,
        source: `call_${index + 1}`,
        target: `call_${index + 2}`,
        label: "",
        type: "smoothstep",
      })),
    };

    const result = buildTraceDiagramLayout(largeGraph);
    assert.ok(result.stats.collapsedNodes > 0);
    assert.ok(result.graph.nodes.length < largeGraph.nodes.length);
  });
});
