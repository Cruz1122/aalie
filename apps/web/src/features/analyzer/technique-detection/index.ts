import type { Program } from "@aa/types";

import { collectTechniqueFacts } from "./analysis/collectFacts";
import { kindOf, type AstNode } from "./ast/astAdapter";
import { buildEvidenceBundle } from "./evidence/evidenceBundle";
import { evaluateTechniqueRules } from "./rules/evaluateRules";
import type { TechniqueDetectionResult } from "./types";

type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

type TechniqueTranslator = (key: string, values?: TranslationValues) => string;

export function detectTechniqueFromAst(
  ast: AstNode | Program | null | undefined,
  sourceCode?: string,
  t?: TechniqueTranslator,
): TechniqueDetectionResult {
  if (!ast || typeof ast !== "object" || kindOf(ast as AstNode) === "unknown") {
    return {
      technique: "unknown",
      confidence: "low",
      score: 1,
      secondarySignals: [],
      evidence: {
        compactSnippet: "",
        items: [],
        explanationFacts: [
          "No hay AST disponible para clasificar la técnica con seguridad.",
        ],
      },
      diagnostics: [
        "No hay AST disponible para clasificar la técnica con seguridad.",
      ],
    };
  }

  const facts = collectTechniqueFacts(ast as AstNode);
  const match = evaluateTechniqueRules(facts);
  const evidence = buildEvidenceBundle(facts, match, t, sourceCode);

  return {
    technique: match.technique,
    confidence: match.confidence,
    score: match.score,
    secondarySignals: match.secondarySignals,
    evidence,
    diagnostics: match.diagnostics,
  };
}

export * from "./types";
