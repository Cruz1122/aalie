import type { StructuredTrace, ExecutionStep, TraceSummary } from "@/types/trace";

import type { AssistantFocusedPanelContext } from "./types";

type BuildTraceFocusedPanelParams = {
  locale: string;
  caseLabel: string;
  traceKind?: string | null;
  inputSize: number;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: ExecutionStep | null;
  initialVariables?: Record<string, unknown> | null;
  structuredTrace?: StructuredTrace | null;
  traceSummary?: TraceSummary;
  loading: boolean;
  error?: string | null;
  fetchCompleted?: boolean;
};

function isSpanish(locale: string): boolean {
  return locale.toLowerCase().startsWith("es");
}

function truncateText(value: string, maxChars = 180): string {
  const normalized = value.trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function formatScalar(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 24 ? `"${truncateText(value, 24)}"` : `"${value}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "null";
  }
  return truncateText(JSON.stringify(value), 32);
}

function formatVariablePreview(
  variables: Record<string, unknown> | null | undefined,
): string | null {
  if (!variables) {
    return null;
  }

  const preview = Object.entries(variables)
    .filter(([key]) => key && key !== "_")
    .slice(0, 4)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const items = value.slice(0, 5).map((entry) => formatScalar(entry));
        const suffix = value.length > 5 ? ", ..." : "";
        return `${key}=[${items.join(", ")}${suffix}]`;
      }
      return `${key}=${formatScalar(value)}`;
    });

  return preview.length > 0 ? preview.join(", ") : null;
}

function formatTraceKind(locale: string, traceKind?: string | null): string | null {
  if (!traceKind) {
    return null;
  }

  const normalized = traceKind.toLowerCase();
  if (isSpanish(locale)) {
    if (normalized === "iterative") return "iterativo";
    if (normalized === "recursive") return "recursivo";
    if (normalized === "hybrid") return "hibrido";
    return traceKind;
  }

  if (normalized === "iterative") return "iterative";
  if (normalized === "recursive") return "recursive";
  if (normalized === "hybrid") return "hybrid";
  return traceKind;
}

function buildRepresentativeNodeSummary(
  structuredTrace?: StructuredTrace | null,
): string | null {
  const nodes = structuredTrace?.graph.nodes;
  if (!nodes || nodes.length === 0) {
    return null;
  }

  const labels = nodes
    .map((node) => truncateText((node.data.label || "").split("\n")[0] || "", 60))
    .filter((label) => label.length > 0);
  const uniqueLabels = Array.from(new Set(labels)).slice(0, 3);
  return uniqueLabels.length > 0 ? uniqueLabels.join(" | ") : null;
}

function buildNodeTypeSummary(structuredTrace?: StructuredTrace | null): string | null {
  const nodes = structuredTrace?.graph.nodes;
  if (!nodes || nodes.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  nodes.forEach((node) => {
    const key = node.type || "default";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .slice(0, 4)
    .map(([type, count]) => `${type}=${count}`)
    .join(", ");
}

export function buildTraceFocusedPanelContext({
  locale,
  caseLabel,
  traceKind,
  inputSize,
  currentStepIndex,
  totalSteps,
  currentStep,
  initialVariables,
  structuredTrace,
  traceSummary,
  loading,
  error,
  fetchCompleted = false,
}: BuildTraceFocusedPanelParams): AssistantFocusedPanelContext {
  const es = isSpanish(locale);
  const text = (spanish: string, english: string) => (es ? spanish : english);
  const notes: string[] = [];
  const graph = structuredTrace?.graph;
  const variablePreview = formatVariablePreview(initialVariables);
  const normalizedTraceKind = formatTraceKind(locale, traceKind);
  const representativeNodes = buildRepresentativeNodeSummary(structuredTrace);
  const nodeTypes = buildNodeTypeSummary(structuredTrace);

  notes.push(
    text(
      `Caso visible en seguimiento: ${caseLabel}.`,
      `Visible case in trace view: ${caseLabel}.`,
    ),
  );

  if (normalizedTraceKind) {
    notes.push(
      text(
        `Tipo de seguimiento visible: ${normalizedTraceKind}.`,
        `Visible trace kind: ${normalizedTraceKind}.`,
      ),
    );
  }

  if (loading) {
    notes.push(
      text(
        "El seguimiento se esta regenerando con los parametros visibles.",
        "The trace is being regenerated with the visible parameters.",
      ),
    );
  } else if (error) {
    notes.push(
      text(
        `Error visible en seguimiento: ${truncateText(error)}.`,
        `Visible trace error: ${truncateText(error)}.`,
      ),
    );
  }

  if (variablePreview) {
    notes.push(
      text(
        `Parametros iniciales visibles: ${variablePreview}.`,
        `Visible initial parameters: ${variablePreview}.`,
      ),
    );
  } else if (inputSize > 0) {
    notes.push(
      text(
        `Tamano de entrada visible: n=${inputSize}.`,
        `Visible input size: n=${inputSize}.`,
      ),
    );
  }

  if (currentStep && totalSteps > 0) {
    const stepHeader = text(
      `Paso visible: ${currentStepIndex + 1}/${totalSteps}`,
      `Visible step: ${currentStepIndex + 1}/${totalSteps}`,
    );
    const lineNote =
      currentStep.line != null
        ? text(`linea ${currentStep.line}`, `line ${currentStep.line}`)
        : null;
    const eventNote = currentStep.eventKind
      ? text(`evento ${currentStep.eventKind}`, `event ${currentStep.eventKind}`)
      : null;
    notes.push(
      `${stepHeader}${lineNote || eventNote ? ` (${[lineNote, eventNote].filter(Boolean).join(", ")})` : ""}.`,
    );
    if (currentStep.description) {
      notes.push(
        text(
          `Descripcion visible del paso: ${truncateText(currentStep.description, 220)}.`,
          `Visible step description: ${truncateText(currentStep.description, 220)}.`,
        ),
      );
    }
  } else if (totalSteps > 0) {
    notes.push(
      text(
        `Pasos visibles en seguimiento: ${totalSteps}.`,
        `Visible trace steps: ${totalSteps}.`,
      ),
    );
  }

  if (graph?.nodes?.length) {
    notes.push(
      text(
        `Diagrama visible: ${graph.nodes.length} nodos y ${graph.edges.length} conexiones.`,
        `Visible diagram: ${graph.nodes.length} nodes and ${graph.edges.length} connections.`,
      ),
    );
    if (structuredTrace?.patternKind) {
      notes.push(
        text(
          `Patron estructural visible: ${structuredTrace.patternKind}.`,
          `Visible structural pattern: ${structuredTrace.patternKind}.`,
        ),
      );
    }
    if (nodeTypes) {
      notes.push(
        text(
          `Tipos de nodo visibles: ${nodeTypes}.`,
          `Visible node types: ${nodeTypes}.`,
        ),
      );
    }
    if (representativeNodes) {
      notes.push(
        text(
          `Nodos representativos visibles: ${representativeNodes}.`,
          `Visible representative nodes: ${representativeNodes}.`,
        ),
      );
    }
  } else if (!loading && fetchCompleted) {
    notes.push(
      text(
        "No hay diagrama visible para los parametros actuales.",
        "No diagram is visible for the current parameters.",
      ),
    );
  }

  if (structuredTrace?.classification?.evidence?.length) {
    notes.push(
      text(
        `Evidencia visible del diagrama: ${structuredTrace.classification.evidence
          .slice(0, 3)
          .map((entry) => truncateText(entry, 80))
          .join(" | ")}.`,
        `Visible diagram evidence: ${structuredTrace.classification.evidence
          .slice(0, 3)
          .map((entry) => truncateText(entry, 80))
          .join(" | ")}.`,
      ),
    );
  }

  if (traceSummary) {
    notes.push(
      text(
        `Resumen visible: ${traceSummary.totalSteps} pasos, ${traceSummary.totalCalls} llamadas, profundidad maxima ${traceSummary.maxRecursionDepth}.`,
        `Visible summary: ${traceSummary.totalSteps} steps, ${traceSummary.totalCalls} calls, max depth ${traceSummary.maxRecursionDepth}.`,
      ),
    );
  }

  return {
    id: "execution-trace-view",
    title: text("Seguimiento de ejecucion", "Execution trace"),
    description: text(
      "Vista de seguimiento paso a paso con resumen curado del diagrama y los parametros visibles.",
      "Step-by-step trace view with a curated summary of the visible diagram and parameters.",
    ),
    notes,
  };
}
