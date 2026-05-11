import type { TechniqueRule } from "./ruleTypes";

export const unknownRule: TechniqueRule = {
  id: "unknown",
  priority: 0,

  evaluate() {
    return {
      technique: "unknown",
      matched: true,
      score: 1,
      confidence: "low" as const,
      evidenceItems: [],
      secondarySignals: [],
      diagnostics: [
        "No hay evidencia estructural suficiente para una técnica principal.",
      ],
    };
  },
};
