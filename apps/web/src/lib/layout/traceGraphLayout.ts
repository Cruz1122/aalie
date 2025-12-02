import dagre from "dagre";

import type { GraphNode, GraphEdge, TraceGraph } from "@/types/trace";

const nodeWidth = 180;
const nodeHeight = 48;

const createGraph = (direction: "TB" | "LR") => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    // Aumentar separación horizontal y vertical para reducir solapamientos
    nodesep: 80,
    ranksep: 100,
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
  const dagreGraph = createGraph(direction);

  // Registrar nodos en dagre
  for (const node of graph.nodes) {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
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
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
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


