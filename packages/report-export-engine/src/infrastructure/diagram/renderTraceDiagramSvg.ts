import type { TraceGraphCanonical } from "@aa/types";

import { buildTraceDiagramLayout } from "../../renderers/shared/trace-diagram-layout";

export interface RenderTraceDiagramSvgInput {
  graph: TraceGraphCanonical;
  title: string;
  caseName: string;
  summary?: {
    totalCalls?: number;
    maxRecursionDepth?: number;
  };
  diagnostics?: {
    truncated?: boolean;
  };
}

export interface RenderTraceDiagramSvgOutput {
  svg: string;
  width: number;
  height: number;
  stats: {
    totalCalls: number;
    maxDepth: number;
    truncated: boolean;
    collapsedNodes: number;
    renderNodeCount: number;
    reductionNote?: string;
  };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function edgeColor(edgeType: string): string {
  if (edgeType === "return") return "#b45309";
  return "#0f172a";
}

function edgeDash(edgeType: string): string {
  if (edgeType === "return") return "6 4";
  return "";
}

function parseLabelParts(label: string): { signature: string; finalState: string; returnValue: string } {
  const lines = String(label || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const signature = lines[0] || "";
  const finalLine = lines.find((line) => /^(estado final|final)\s*:/i.test(line)) || "";
  const returnLine = lines.find((line) => /^→/.test(line)) || "";
  return {
    signature,
    finalState: finalLine.replace(/^(estado final|final)\s*:\s*/i, "").trim(),
    returnValue: returnLine.replace(/^→\s*/, "").trim(),
  };
}

function wrapLine(line: string, maxChars: number): string[] {
  const text = line.trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if ((current + " " + word).length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildNodeTextLines(label: string): string[] {
  const baseLines = String(label || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const wrapped = baseLines.flatMap((line) => wrapLine(line, 30));
  if (wrapped.length <= 5) return wrapped;
  const clipped = wrapped.slice(0, 5);
  clipped[4] = `${clipped[4].slice(0, 27)}...`;
  return clipped;
}

function extractStateSummary(graph: TraceGraphCanonical): { initial: string; final: string } {
  const incoming = new Map<string, number>();
  for (const node of graph.nodes) incoming.set(node.id, 0);
  for (const edge of graph.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  }
  const roots = graph.nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  const root = (roots.length > 0 ? roots : graph.nodes).sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!root) {
    return { initial: "N/A", final: "N/A" };
  }
  const parts = parseLabelParts(String(root.data?.label || ""));
  return {
    initial: parts.signature || "N/A",
    final: parts.finalState || parts.returnValue || "N/A",
  };
}

function buildFooterPanel(input: {
  width: number;
  top: number;
  caseName: string;
  totalCalls: number;
  maxDepth: number;
  visibleNodes: number;
  initialState: string;
  finalState: string;
  note: string;
}): string {
  const leftX = 24;
  const panelWidth = Math.max(520, input.width - 48);
  const titleY = input.top + 24;
  const bodyY = input.top + 50;
  const rightColX = leftX + Math.floor(panelWidth * 0.54);

  return [
    `<rect x="${leftX}" y="${input.top}" width="${panelWidth}" height="124" rx="14" ry="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" />`,
    `<text x="${leftX + 16}" y="${titleY}" font-size="15" font-weight="700" fill="#0f172a">Resumen de ejecución</text>`,
    `<text x="${leftX + 16}" y="${bodyY}" font-size="13" fill="#1e293b">Caso: ${escapeXml(input.caseName)}</text>`,
    `<text x="${leftX + 16}" y="${bodyY + 20}" font-size="13" fill="#1e293b">Llamadas: ${input.totalCalls} | Profundidad: ${input.maxDepth} | Nodos visibles: ${input.visibleNodes}</text>`,
    `<text x="${leftX + 16}" y="${bodyY + 44}" font-size="13" fill="#0f172a" font-weight="600">Estado inicial</text>`,
    `<text x="${leftX + 16}" y="${bodyY + 62}" font-size="12.5" fill="#334155">${escapeXml(input.initialState)}</text>`,
    `<text x="${rightColX}" y="${bodyY + 44}" font-size="13" fill="#0f172a" font-weight="600">Estado final</text>`,
    `<text x="${rightColX}" y="${bodyY + 62}" font-size="12.5" fill="#334155">${escapeXml(input.finalState)}</text>`,
    input.note
      ? `<text x="${leftX + 16}" y="${bodyY + 90}" font-size="12.5" fill="#7c2d12">${escapeXml(input.note)}</text>`
      : "",
  ].join("\n");
}

export function renderTraceDiagramSvg(input: RenderTraceDiagramSvgInput): RenderTraceDiagramSvgOutput {
  const layouted = buildTraceDiagramLayout(input.graph, {
    summary: input.summary,
    diagnostics: input.diagnostics,
  });

  const nodeWidth = 300;
  const nodeHeight = 108;
  const footerHeight = 156;
  const width = Math.max(680, layouted.width);
  const height = Math.max(260, layouted.height) + footerHeight;

  const nodesSvg = layouted.graph.nodes
    .map((node) => {
      const x = node.position.x;
      const y = node.position.y;
      const lines = buildNodeTextLines(String(node.data?.label || node.id));
      const textY = y + 34;
      const textSvg = lines
        .map((line, index) => (
          `<tspan x="${x + nodeWidth / 2}" y="${textY + index * 19}" text-anchor="middle">${escapeXml(line)}</tspan>`
        ))
        .join("\n");

      return [
        `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="14" ry="14" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" />`,
        `<text font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#0f172a">${textSvg}</text>`,
      ].join("\n");
    })
    .join("\n");

  const nodeIndex = new Map(layouted.graph.nodes.map((node) => [node.id, node]));
  const edgesSvg = layouted.graph.edges
    .map((edge) => {
      const source = nodeIndex.get(edge.source);
      const target = nodeIndex.get(edge.target);
      if (!source || !target) return "";

      const isReturn = edge.type === "return";
      const x1 = isReturn ? source.position.x + nodeWidth / 2 : source.position.x + nodeWidth;
      const y1 = isReturn ? source.position.y + 10 : source.position.y + nodeHeight / 2;
      const x2 = isReturn ? target.position.x + nodeWidth / 2 : target.position.x;
      const y2 = isReturn ? target.position.y + 10 : target.position.y + nodeHeight / 2;
      const mx = (x1 + x2) / 2;
      const archLift = isReturn ? Math.max(56, Math.abs(x2 - x1) * 0.12) : 0;
      const c1y = isReturn ? y1 - archLift : y1;
      const c2y = isReturn ? y2 - archLift : y2;
      const path = `M ${x1} ${y1} C ${mx} ${c1y}, ${mx} ${c2y}, ${x2} ${y2}`;

      let label = String(edge.label || "").trim();
      if (!label && isReturn) {
        const fallback = parseLabelParts(String(source.data?.label || "")).returnValue;
        label = fallback;
      }
      const rawLabelY = isReturn ? Math.min(c1y, c2y) - 8 : (y1 + y2) / 2 - 8;
      const labelY = Math.max(32, rawLabelY);
      const labelSvg = label
        ? `<text x="${mx}" y="${labelY}" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(label)}</text>`
        : "";

      return [
        `<path d="${path}" fill="none" stroke="${edgeColor(edge.type)}" stroke-width="${isReturn ? 2.2 : 1.9}" stroke-dasharray="${edgeDash(edge.type)}" marker-end="url(#arrowhead)" />`,
        labelSvg,
      ].join("\n");
    })
    .join("\n");

  const stateSummary = extractStateSummary(layouted.graph);
  const footerNote = layouted.stats.truncated
    ? "Advertencia: el trace original fue truncado."
    : layouted.stats.reductionNote || "";
  const footer = buildFooterPanel({
    width,
    top: height - footerHeight + 16,
    caseName: input.caseName,
    totalCalls: layouted.stats.totalCalls,
    maxDepth: layouted.stats.maxDepth,
    visibleNodes: layouted.stats.renderNodeCount,
    initialState: stateSummary.initial,
    finalState: stateSummary.final,
    note: footerNote,
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
    </marker>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
  <text x="24" y="30" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">${escapeXml(input.title)}</text>
  <g transform="translate(0, 16)">
${edgesSvg}
${nodesSvg}
  </g>
  ${footer}
</svg>`;

  return {
    svg,
    width,
    height,
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
