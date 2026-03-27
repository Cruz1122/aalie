import type { TraceGraphCanonical } from "@aa/types";

import { buildTraceDiagramLayout } from "./trace-diagram-layout";

export interface RenderTraceDiagramMermaidInput {
  graph: TraceGraphCanonical;
  summary?: {
    totalCalls?: number;
    maxRecursionDepth?: number;
  };
  diagnostics?: {
    truncated?: boolean;
  };
}

export interface RenderTraceDiagramMermaidOutput {
  mermaid: string;
  stats: {
    totalCalls: number;
    maxDepth: number;
    truncated: boolean;
    collapsedNodes: number;
    renderNodeCount: number;
    reductionNote?: string;
  };
}

function sanitizeId(id: string): string {
  const clean = id.replace(/[^A-Za-z0-9_]/g, "_");
  if (/^[0-9]/.test(clean)) {
    return `n_${clean}`;
  }
  return clean || "n_unknown";
}

function escapeLabel(label: string): string {
  return label
    .replace(/\"/g, "'")
    .replace(/\n/g, "<br/>");
}

export function renderTraceDiagramMermaid(
  input: RenderTraceDiagramMermaidInput,
): RenderTraceDiagramMermaidOutput {
  const layouted = buildTraceDiagramLayout(input.graph, {
    summary: input.summary,
    diagnostics: input.diagnostics,
  });

  const nodeLines = layouted.graph.nodes.map((node) => {
    const id = sanitizeId(node.id);
    const label = escapeLabel(String(node.data?.label || node.id));
    return `  ${id}[\"${label}\"]`;
  });

  const edgeLines = layouted.graph.edges
    .filter((edge) => edge.source !== edge.target)
    .map((edge) => {
      const source = sanitizeId(edge.source);
      const target = sanitizeId(edge.target);
      const label = String(edge.label || "").trim();
      if (edge.type === "return") {
        return label
          ? `  ${source} -. \"${escapeLabel(label)}\" .-> ${target}`
          : `  ${source} -.-> ${target}`;
      }
      return label
        ? `  ${source} -- \"${escapeLabel(label)}\" --> ${target}`
        : `  ${source} --> ${target}`;
    });

  const mermaid = [
    "```mermaid",
    "flowchart LR",
    ...nodeLines,
    ...edgeLines,
    "```",
  ].join("\n");

  return {
    mermaid,
    stats: {
      totalCalls: layouted.stats.totalCalls,
      maxDepth: layouted.stats.maxDepth,
      truncated: layouted.stats.truncated,
      collapsedNodes: layouted.stats.collapsedNodes,
      renderNodeCount: layouted.stats.renderNodeCount,
      reductionNote: layouted.stats.reductionNote,
    },
  };
}
