import { describe, expect, it } from "vitest";

import { buildTraceFocusedPanelContext } from "@/lib/assistant/trace-focused-panel";

describe("trace focused panel context", () => {
  it("builds a curated trace summary with visible diagram and parameters", () => {
    const panel = buildTraceFocusedPanelContext({
      locale: "es",
      caseLabel: "peor",
      traceKind: "recursive",
      inputSize: 8,
      currentStepIndex: 2,
      totalSteps: 7,
      currentStep: {
        step_number: 3,
        line: 5,
        kind: "call",
        eventKind: "call_enter",
        variables: { n: 8 },
        description: "Se abre una llamada recursiva sobre la mitad izquierda.",
      },
      initialVariables: {
        n: 8,
        A: [5, 1, 4, 2, 8, 3],
      },
      structuredTrace: {
        patternKind: "divide_merge_recurse",
        classification: {
          patternKind: "divide_merge_recurse",
          confidence: "high",
          evidence: ["divide input", "combine partial results"],
        },
        graph: {
          nodes: [
            {
              id: "1",
              type: "input",
              position: { x: 0, y: 0 },
              data: { label: "mergeSort(n=8)" },
            },
            {
              id: "2",
              type: "default",
              position: { x: 0, y: 80 },
              data: { label: "mergeSort(n=4)" },
            },
            {
              id: "3",
              type: "output",
              position: { x: 0, y: 160 },
              data: { label: "RETURN" },
            },
          ],
          edges: [
            { id: "e1", source: "1", target: "2", label: "", type: "smoothstep" },
            { id: "e2", source: "2", target: "3", label: "", type: "smoothstep" },
          ],
        },
      },
      traceSummary: {
        totalSteps: 7,
        totalCalls: 3,
        maxRecursionDepth: 2,
        algorithmKind: "recursive",
      },
      loading: false,
      error: null,
      fetchCompleted: true,
    });

    expect(panel.id).toBe("execution-trace-view");
    expect(panel.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Caso visible en seguimiento: peor"),
        expect.stringContaining("Parametros iniciales visibles"),
        expect.stringContaining("Diagrama visible: 3 nodos y 2 conexiones"),
        expect.stringContaining("Patron estructural visible: divide_merge_recurse"),
        expect.stringContaining("Nodos representativos visibles"),
      ]),
    );
  });

  it("reports when the current parameters do not produce a visible diagram", () => {
    const panel = buildTraceFocusedPanelContext({
      locale: "en",
      caseLabel: "worst",
      traceKind: "iterative",
      inputSize: 5,
      currentStepIndex: 0,
      totalSteps: 0,
      currentStep: null,
      initialVariables: { n: 5 },
      structuredTrace: null,
      traceSummary: undefined,
      loading: false,
      error: null,
      fetchCompleted: true,
    });

    expect(panel.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Visible initial parameters"),
        expect.stringContaining("No diagram is visible for the current parameters"),
      ]),
    );
  });
});
