import { describe, expect, it } from "vitest";

import {
  buildAssistantSystemSupplement,
  formatAssistantContextForPrompt,
  sanitizeAssistantContext,
} from "@/lib/assistant/context-format";
import type { AssistantContext } from "@/lib/assistant/types";

describe("assistant context formatting", () => {
  it("serializes formal analysis, source code, and focused entities", () => {
    const context: AssistantContext = {
      surface: "analyzer",
      locale: "es",
      pageContext: {
        route: "/analyzer",
        view: "analysis",
        title: "Analizador",
        description: "Vista principal",
        notes: ["selectedCase=worst"],
      },
      exampleSections: [
        {
          id: "divide_and_conquer",
          slug: "divide-and-conquer",
          title: "Divide y vencerás",
          description: "Subdivide el problema",
          exampleCount: 6,
          kind: "recursive",
        },
      ],
      visibleExamples: [
        {
          id: "merge-sort",
          slug: "merge-sort",
          title: "Merge Sort",
          summary: "Divide, ordena y combina",
          category: "Divide y vencerás",
          family: "Ordenamiento",
          methods: ["TM", "AR"],
          tags: ["merge", "recursivo"],
          source: "mergeSort(A, inicio, fin) BEGIN\nRETURN A;\nEND",
        },
      ],
      sourceCode: "factorial(n) BEGIN\nRETURN n;\nEND",
      formalAnalysisSummary: {
        parseStatus: "ok",
        analysisStatus: "complete",
        algorithmType: "Recursivo",
        selectedCase: "worst",
        selectedMethod: "Teorema Maestro",
        cases: [
          {
            caseId: "worst",
            bigO: "O(n log n)",
            bigOmega: "Omega(n log n)",
            bigTheta: "Theta(n log n)",
            efficiencyEquation: "\\sum_{i=1}^{n} C_i",
            groupedCostExpression: "an^2 + bn + c",
          },
        ],
      },
    };

    const prompt = formatAssistantContextForPrompt(context);

    expect(prompt).toContain("CONTEXTO EMBEBIDO DE AALIE");
    expect(prompt).toContain("ANALISIS FORMAL DISPONIBLE");
    expect(prompt).toContain("selectedMethod: Teorema Maestro");
    expect(prompt).toContain("efficiencyEquation: \\sum_{i=1}^{n} C_i");
    expect(prompt).toContain("groupedCostExpression: an^2 + bn + c");
    expect(prompt).not.toContain("T_open");
    expect(prompt).not.toContain("T_polynomial");
    expect(prompt).toContain("SECCIONES DE EJEMPLOS DISPONIBLES");
    expect(prompt).toContain("ALGORITMOS VISIBLES EN ESTA VISTA");
    expect(prompt).toContain("Merge Sort");
    expect(prompt).toContain("```pseudocode");
    expect(prompt).toContain("factorial(n) BEGIN");
  });

  it("truncates long free-form fields deterministically", () => {
    const longText = "x".repeat(4500);
    const sanitized = sanitizeAssistantContext({
      surface: "user-guide",
      locale: "en",
      pageContext: {
        route: "/user-guide",
      },
      guideSection: {
        id: "intro",
        title: "Intro",
        summary: longText,
      },
      sourceCode: longText,
    });

    expect(sanitized.guideSection?.summary?.length).toBeLessThanOrEqual(4000);
    expect(sanitized.guideSection?.summary?.endsWith("…")).toBe(true);
    expect(sanitized.sourceCode?.length).toBeLessThanOrEqual(4000);
    expect(sanitized.sourceCode?.endsWith("…")).toBe(true);
  });

  it("adds embedded assistant source-of-truth rules to the system prompt", () => {
    const supplement = buildAssistantSystemSupplement({
      surface: "examples",
      locale: "es",
      pageContext: {
        route: "/examples",
      },
    });

    expect(supplement).toContain("fuente de verdad");
    expect(supplement.toLowerCase()).toContain("no sustituyas");
    expect(supplement.toLowerCase()).toContain("comparación con llm");
    expect(supplement.toLowerCase()).toContain('evita repetir "en aalie"');
    expect(supplement.toLowerCase()).toContain("referencia principal");
  });

  it("formats focused panels and available app features", () => {
    const prompt = formatAssistantContextForPrompt({
      surface: "home",
      locale: "es",
      pageContext: {
        route: "/",
        title: "Inicio",
      },
      focusedPanel: {
        id: "gpu-cpu-modal",
        title: "Analisis GPU/CPU",
        description: "Resumen del modal activo",
        notes: ["recommendation=gpu", "confidence=high"],
      },
      availableFeatures: [
        {
          id: "compare-with-llm",
          title: "Comparar con LLM",
          location: "/analyzer",
          description: "Contraste rapido con IA",
          availability: "Requiere API key",
        },
      ],
    });

    expect(prompt).toContain("FOCO ACTUAL PRIORITARIO");
    expect(prompt).toContain("Analisis GPU/CPU");
    expect(prompt).toContain("FUNCIONALIDADES RELEVANTES DE LA APP");
    expect(prompt).toContain("Comparar con LLM");
    expect(prompt).toContain("- recommendation=gpu");
    expect(prompt).toContain("- confidence=high");
  });

  it("places the focused panel before formal analysis so UI focus has higher priority", () => {
    const prompt = formatAssistantContextForPrompt({
      surface: "analyzer",
      locale: "es",
      pageContext: {
        route: "/analyzer",
        view: "analysis",
      },
      focusedPanel: {
        id: "line-procedure-modal",
        title: "Procedimiento por linea",
        description: "Detalle del paso activo",
      },
      formalAnalysisSummary: {
        parseStatus: "ok",
        analysisStatus: "complete",
        selectedMethod: "Conteo",
      },
    });

    expect(prompt.indexOf("FOCO ACTUAL PRIORITARIO")).toBeGreaterThan(-1);
    expect(prompt.indexOf("ANALISIS FORMAL DISPONIBLE")).toBeGreaterThan(-1);
    expect(prompt.indexOf("FOCO ACTUAL PRIORITARIO")).toBeLessThan(
      prompt.indexOf("ANALISIS FORMAL DISPONIBLE"),
    );
  });
});
