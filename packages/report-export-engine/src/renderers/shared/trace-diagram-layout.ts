import dagre from "dagre";

import type { TraceGraphCanonical, TraceGraphEdge, TraceGraphNode } from "@aa/types";

export interface TraceDiagramStats {
  totalCalls: number;
  maxDepth: number;
  totalEdges: number;
  truncated: boolean;
  labelMode: "full" | "compact";
  collapsedNodes: number;
  renderNodeCount: number;
  reductionNote?: string;
}

export interface TraceDiagramLayoutResult {
  graph: TraceGraphCanonical;
  width: number;
  height: number;
  stats: TraceDiagramStats;
}

interface NormalizeOptions {
  summary?: {
    totalCalls?: number;
    maxRecursionDepth?: number;
  };
  diagnostics?: {
    truncated?: boolean;
  };
}

interface IndexedNode {
  node: TraceGraphNode;
  depth: number;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sanitizeNode(node: TraceGraphNode): TraceGraphNode {
  return {
    id: String(node.id),
    type: String(node.type || "default"),
    position: {
      x: asFiniteNumber(node.position?.x, 0),
      y: asFiniteNumber(node.position?.y, 0),
    },
    data: {
      label: String(node.data?.label || node.id),
      microseconds: typeof node.data?.microseconds === "number" ? node.data.microseconds : undefined,
      tokens: typeof node.data?.tokens === "number" ? node.data.tokens : undefined,
    },
    parentId: typeof node.parentId === "string" ? node.parentId : undefined,
  };
}

function sanitizeEdge(edge: TraceGraphEdge, index: number): TraceGraphEdge {
  return {
    id: String(edge.id || `edge_${index}`),
    source: String(edge.source),
    target: String(edge.target),
    label: String(edge.label || ""),
    type: String(edge.type || "smoothstep"),
  };
}

function detectRoots(nodes: TraceGraphNode[], edges: TraceGraphEdge[]): string[] {
  const incoming = new Map<string, number>();
  for (const node of nodes) incoming.set(node.id, 0);
  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  }
  const roots = Array.from(incoming.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort();
  return roots.length > 0 ? roots : nodes.map((node) => node.id).sort().slice(0, 1);
}

function buildDepthIndex(nodes: TraceGraphNode[], edges: TraceGraphEdge[]): Map<string, number> {
  const bySource = new Map<string, string[]>();
  for (const edge of edges) {
    if (!bySource.has(edge.source)) bySource.set(edge.source, []);
    bySource.get(edge.source)?.push(edge.target);
  }
  for (const children of bySource.values()) children.sort();

  const roots = detectRoots(nodes, edges);
  const depth = new Map<string, number>();
  const queue = roots.map((root) => ({ id: root, depth: 0 }));
  for (const item of queue) depth.set(item.id, item.depth);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const children = bySource.get(current.id) || [];
    for (const child of children) {
      const nextDepth = current.depth + 1;
      const known = depth.get(child);
      if (typeof known === "undefined" || nextDepth < known) {
        depth.set(child, nextDepth);
        queue.push({ id: child, depth: nextDepth });
      }
    }
  }

  for (const node of nodes) {
    if (!depth.has(node.id)) depth.set(node.id, 0);
  }
  return depth;
}

function compactLabel(label: string, maxCharsPerLine: number, maxLines: number): string {
  const rawLines = String(label || "").split("\n");
  const compacted: string[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.length <= maxCharsPerLine) {
      compacted.push(line);
      continue;
    }
    compacted.push(`${line.slice(0, Math.max(1, maxCharsPerLine - 1))}…`);
  }

  if (compacted.length === 0) return "call";
  if (compacted.length <= maxLines) return compacted.join("\n");
  return `${compacted.slice(0, Math.max(1, maxLines - 1)).join("\n")}\n…`;
}

function synthesizeReturnEdges(nodes: TraceGraphNode[], edges: TraceGraphEdge[]): TraceGraphEdge[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const synthetic: TraceGraphEdge[] = [];

  for (const edge of edges) {
    const child = nodeById.get(edge.target);
    const label = child?.data?.label || "";
    const match = /(?:\n|^)→\s*(.+?)(?:\n|$)/.exec(label);
    if (!match) continue;
    const returnValue = match[1]?.trim() || "ret";
    synthetic.push({
      id: `return_${edge.target}_to_${edge.source}`,
      source: edge.target,
      target: edge.source,
      label: returnValue,
      type: "return",
    });
  }

  return synthetic;
}

function buildReduction(
  nodes: TraceGraphNode[],
  edges: TraceGraphEdge[],
): { nodes: TraceGraphNode[]; edges: TraceGraphEdge[]; labelMode: "full" | "compact"; collapsedNodes: number; reductionNote?: string } {
  const count = nodes.length;
  if (count <= 25) {
    return { nodes, edges, labelMode: "full", collapsedNodes: 0 };
  }

  if (count <= 60) {
    const compactNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        label: compactLabel(node.data?.label || "", 54, 3),
      },
    }));
    return {
      nodes: compactNodes,
      edges,
      labelMode: "compact",
      collapsedNodes: 0,
      reductionNote: "Render completo con etiquetas compactas por volumen de nodos.",
    };
  }

  const depthIndex = buildDepthIndex(nodes, edges);
  const maxVisibleDepth = 4;
  const visibleIds = new Set(
    Array.from(depthIndex.entries())
      .filter(([, depth]) => depth <= maxVisibleDepth)
      .map(([id]) => id),
  );

  const reducedNodes = nodes
    .filter((node) => visibleIds.has(node.id))
    .map((node) => ({
      ...node,
      data: {
        ...node.data,
        label: compactLabel(node.data?.label || "", 48, 3),
      },
    }));

  const reducedEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const collapsedNodes = Math.max(0, nodes.length - reducedNodes.length);

  return {
    nodes: reducedNodes,
    edges: reducedEdges,
    labelMode: "compact",
    collapsedNodes,
    reductionNote:
      collapsedNodes > 0
        ? `Se colapsaron ${collapsedNodes} nodos por límite de profundidad visible (>${maxVisibleDepth}).`
        : undefined,
  };
}

function layoutGraph(nodes: TraceGraphNode[], edges: TraceGraphEdge[]): { nodes: TraceGraphNode[]; width: number; height: number } {
  const graph = new dagre.graphlib.Graph({ multigraph: true, directed: true });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 120, ranksep: 170, marginx: 30, marginy: 30 });

  const nodeWidth = 300;
  const nodeHeight = 108;

  for (const node of nodes) {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target, {}, edge.id);
  }

  dagre.layout(graph);

  let maxX = 0;
  let maxY = 0;

  const layouted = nodes.map((node) => {
    const dNode = graph.node(node.id);
    const x = asFiniteNumber(dNode?.x, 0) - nodeWidth / 2;
    const y = asFiniteNumber(dNode?.y, 0) - nodeHeight / 2;
    maxX = Math.max(maxX, x + nodeWidth);
    maxY = Math.max(maxY, y + nodeHeight);
    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    nodes: layouted,
    width: Math.ceil(maxX + 40),
    height: Math.ceil(maxY + 80),
  };
}

export function buildTraceDiagramLayout(
  inputGraph: TraceGraphCanonical,
  options: NormalizeOptions = {},
): TraceDiagramLayoutResult {
  const nodes = (inputGraph.nodes || []).map(sanitizeNode).sort((a, b) => a.id.localeCompare(b.id));
  const edges = (inputGraph.edges || [])
    .map((edge, index) => sanitizeEdge(edge, index))
    .filter((edge) => Boolean(edge.source) && Boolean(edge.target))
    .sort((a, b) => a.id.localeCompare(b.id));

  const reduction = buildReduction(nodes, edges);
  const withReturnEdges = [...reduction.edges, ...synthesizeReturnEdges(reduction.nodes, reduction.edges)];
  const layouted = layoutGraph(reduction.nodes, withReturnEdges);
  const depthIndex = buildDepthIndex(layouted.nodes, withReturnEdges);

  const maxDepth = Math.max(
    asFiniteNumber(options.summary?.maxRecursionDepth, 0),
    ...Array.from(depthIndex.values()),
  );

  return {
    graph: {
      nodes: layouted.nodes,
      edges: withReturnEdges,
    },
    width: layouted.width,
    height: layouted.height,
    stats: {
      totalCalls: asFiniteNumber(options.summary?.totalCalls, layouted.nodes.length),
      maxDepth,
      totalEdges: withReturnEdges.length,
      truncated: Boolean(options.diagnostics?.truncated),
      labelMode: reduction.labelMode,
      collapsedNodes: reduction.collapsedNodes,
      renderNodeCount: layouted.nodes.length,
      reductionNote: reduction.reductionNote,
    },
  };
}

export function collectNodeDepths(graph: TraceGraphCanonical): IndexedNode[] {
  const depthIndex = buildDepthIndex(graph.nodes || [], graph.edges || []);
  return (graph.nodes || [])
    .map((node) => ({ node, depth: depthIndex.get(node.id) || 0 }))
    .sort((a, b) => a.node.id.localeCompare(b.node.id));
}
