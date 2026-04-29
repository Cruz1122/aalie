/**
 * Hook para controlar el stepping interactivo de árbol de recursión.
 * 
 * Características:
 * - Stepping nodo por nodo (máximo detalle)
 * - Ocultar nodos al retroceder (contracción del árbol)
 * - Velocidad configurable (slider)
 * - Play/Pause/Next/Prev controles
 * 
 * Author: AALIE - Recursive Stepping Feature
 * Version: 1.0.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "@/types/trace";

type RecursionStepEvent = {
  kind: "node" | "return";
  nodeId: string;
  order: number;
};

export interface RecursionStepperState {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total steps available */
  totalSteps: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Playback speed in ms per step */
  playbackSpeed: number;
  /** Visible node IDs filtered by currentStep */
  visibleNodeIds: Set<string>;
  /** Visible edge IDs filtered by currentStep */
  visibleEdgeIds: Set<string>;
  /** The node currently being highlighted */
  currentNodeId: string | null;
  /** The event kind currently being shown */
  currentEventKind: RecursionStepEvent["kind"] | null;
}

export interface RecursionStepperActions {
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
}

const edgePairKey = (sourceId: string, targetId: string): string => `${sourceId}::${targetId}`;

const normalizeParentNodeId = (rawParentId: string | null | undefined): string | null => {
  if (!rawParentId) {
    return null;
  }
  if (rawParentId.startsWith("call_call_")) {
    return rawParentId;
  }
  if (rawParentId.startsWith("call_")) {
    return `call_${rawParentId}`;
  }
  return `call_${rawParentId}`;
};

/**
 * Hook to manage recursive stepping visualization.
 * 
 * @param nodes - All graph nodes (with executionOrder/returnOrder metadata)
 * @param edges - All graph edges (used to resolve real edge IDs for call/return rendering)
 * @returns Stepping state and control actions
 */
export function useRecursionStepper(
  nodes: GraphNode[],
  edges: GraphEdge[],
): [RecursionStepperState, RecursionStepperActions] {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per step
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const orderA = a.data?.executionOrder ?? Infinity;
      const orderB = b.data?.executionOrder ?? Infinity;
      return orderA - orderB;
    });
  }, [nodes]);

  const parentByNode = useMemo(() => {
    const mapping = new Map<string, string | null>();
    sortedNodes.forEach((node) => {
      const parentId = node.parentId ?? normalizeParentNodeId(node.data?.parentCallId ?? null);
      mapping.set(node.id, parentId);
    });
    return mapping;
  }, [sortedNodes]);

  const childrenByParent = useMemo(() => {
    const childrenByParent = new Map<string, string[]>();
    edges.forEach((edge) => {
      const isReturnEdge =
        edge.type === "return" || edge.label === "return" || edge.id.startsWith("e_ret_");
      if (isReturnEdge) {
        return;
      }
      if (!childrenByParent.has(edge.source)) {
        childrenByParent.set(edge.source, []);
      }
      childrenByParent.get(edge.source)!.push(edge.target);
    });
    return childrenByParent;
  }, [edges]);

  const edgeIdByPair = useMemo(() => {
    const nextEdgeMap = new Map<string, string>();
    edges.forEach((edge) => {
      const key = edgePairKey(edge.source, edge.target);
      if (!nextEdgeMap.has(key)) {
        nextEdgeMap.set(key, edge.id);
      }
    });
    return nextEdgeMap;
  }, [edges]);

  const sortedEvents = useMemo(() => {
    const rootIds = sortedNodes
      .filter((node) => !parentByNode.get(node.id))
      .map((node) => node.id);

    const orderedNodeIds = sortedNodes.map((node) => node.id);
    const visited = new Set<string>();
    const events: RecursionStepEvent[] = [];

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      events.push({ kind: "node", nodeId, order: events.length });

      const children = childrenByParent.get(nodeId) ?? [];
      for (const childId of children) {
        dfs(childId);
      }

      events.push({ kind: "return", nodeId, order: events.length });
    };

    rootIds.forEach((rootId) => dfs(rootId));

    orderedNodeIds.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    });

    return events;
  }, [childrenByParent, parentByNode, sortedNodes]);

  const currentEvent = sortedEvents[currentStep] ?? null;

  const { visibleNodeIds, visibleEdgeIds } = useMemo(() => {
    const visibleNodes = new Set<string>();
    const visibleEdges = new Set<string>();
    const eventByNode = new Map<string, RecursionStepEvent>();

    for (let index = 0; index <= currentStep && index < sortedEvents.length; index += 1) {
      const event = sortedEvents[index];
      eventByNode.set(event.nodeId, event);
      visibleNodes.add(event.nodeId);
    }

    sortedNodes.forEach((node) => {
      const parentId =
        node.parentId ?? normalizeParentNodeId(node.data?.parentCallId ?? null);
      if (!parentId) {
        return;
      }

      const nodeEvent = eventByNode.get(node.id);
      if (!nodeEvent) {
        return;
      }

      if (nodeEvent.kind === "node") {
        const callEdgeId = edgeIdByPair.get(edgePairKey(parentId, node.id));
        if (callEdgeId) {
          visibleEdges.add(callEdgeId);
        }
      }

      if (nodeEvent.kind === "return") {
        const returnEdgeId = edgeIdByPair.get(edgePairKey(node.id, parentId));
        if (returnEdgeId) {
          visibleEdges.add(returnEdgeId);
        }
      }
    });

    return {
      visibleNodeIds: visibleNodes,
      visibleEdgeIds: visibleEdges,
    };
  }, [currentStep]);

  const currentNodeId = currentEvent?.nodeId ?? null;
  const currentEventKind = currentEvent?.kind ?? null;

  const totalSteps = sortedEvents.length;

  // Handle playback auto-advance
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      return;
    }

    playbackIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        }
        // Stop playback when reaching the end
        setIsPlaying(false);
        return prev;
      });
    }, playbackSpeed);

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Action handlers
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSetCurrentStep = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, totalSteps - 1));
    setCurrentStep(clamped);
  }, [totalSteps]);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSetPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(Math.max(100, Math.min(speed, 5000))); // Clamp: 100ms - 5s
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const state: RecursionStepperState = {
    currentStep,
    totalSteps,
    isPlaying,
    playbackSpeed,
    visibleNodeIds,
    visibleEdgeIds,
    currentNodeId,
    currentEventKind,
  };

  const actions: RecursionStepperActions = {
    nextStep,
    prevStep,
    setCurrentStep: handleSetCurrentStep,
    togglePlayback,
    setPlaybackSpeed: handleSetPlaybackSpeed,
    reset,
  };

  return [state, actions];
}
