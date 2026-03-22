import dagre from "dagre";

import type { GraphNode, GraphEdge, TraceGraph } from "@/types/trace";

const nodeWidth = 180;
const nodeHeight = 48;
const callTreeNodeWidth = 220;
const callTreeNodeHeight = 80;

function isCallTree(graph: TraceGraph): boolean {
  return graph.nodes?.some((n) => n.id?.startsWith("call_")) ?? false;
}

const createGraph = (
  direction: "TB" | "LR",
  nodesep: number,
  ranksep: number,
) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
  });
  return g;
};

export interface LayoutOptions {
  direction?: "TB" | "LR";
}

export function getLayoutedGraph(
  graph: TraceGraph | null | undefined,
  options: LayoutOptions = {},
): TraceGraph {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const direction = options.direction ?? "TB";
  const callTree = isCallTree(graph);
  const w = callTree ? callTreeNodeWidth : nodeWidth;
  const h = callTree ? callTreeNodeHeight : nodeHeight;
  const nodesep = callTree ? 100 : 80;
  const ranksep = callTree ? 140 : 100;
  const dagreGraph = createGraph(direction, nodesep, ranksep);

  // Registrar nodos en dagre
  for (const node of graph.nodes) {
    dagreGraph.setNode(node.id, {
      width: w,
      height: h,
    });
  }

  // Registrar edges en dagre (solo si tienen source/target válidos)
  for (const edge of graph.edges ?? []) {
    if (!edge.source || !edge.target) continue;
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const layoutedNodes: GraphNode[] = graph.nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    if (!dagreNode) {
      return node;
    }

    return {
      ...node,
      position: {
        x: dagreNode.x - w / 2,
        y: dagreNode.y - h / 2,
      },
    };
  });

  // No modificamos edges aquí, solo devolvemos tal cual
  const layoutedEdges: GraphEdge[] = [...(graph.edges ?? [])];

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges,
  };
}


