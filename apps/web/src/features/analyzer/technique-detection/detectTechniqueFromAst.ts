import type { Program } from "@aa/types";

import { extractAstSignals } from "./astSignals";
import { buildEvidenceSnippet } from "./evidenceSnippet";
import { getTechniqueRules, signalLabels } from "./techniqueRules";
import type { TechniqueDetectionResult } from "./techniqueTypes";

type TechniqueTranslator = (key: string) => string;

export function detectTechniqueFromAst(
  ast: Program | null | undefined,
  _sourceCode: string,
  t: TechniqueTranslator,
): TechniqueDetectionResult {
  if (!ast) {
    return {
      technique: "unknown",
      confidence: "low",
      signals: [],
      explanation: "No hay AST disponible para clasificar.",
      evidenceSnippet: {
        kind: "none",
        code: "",
      },
    };
  }

  const signals = extractAstSignals(ast);
  const rules = getTechniqueRules(t);
  const rule = rules.find(
    (candidate) => candidate.match(signals).matched,
  );

  if (!rule) {
    return {
      technique: "unknown",
      confidence: "low",
      signals: signalLabels(signals),
      explanation: "No hay regla aplicable.",
      evidenceSnippet: {
        kind: "none",
        code: "",
      },
    };
  }

  const match = rule.match(signals);

  return {
    technique: rule.technique,
    confidence: rule.confidence,
    signals: signalLabels(signals),
    explanation: rule.explanation,
    evidenceSnippet: buildEvidenceSnippet(rule.technique, match.evidenceNode),
  };
}
