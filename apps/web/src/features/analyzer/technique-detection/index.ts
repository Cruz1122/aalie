import type { Program } from "@aa/types";

import { collectTechniqueFacts } from "./analysis/collectFacts";
import { kindOf, type AstNode } from "./ast/astAdapter";
import { buildEvidenceBundle } from "./evidence/evidenceBundle";
import { evaluateTechniqueRules } from "./rules/evaluateRules";
import type { TechniqueDetectionResult } from "./types";

type TranslationValues = Record<string, string | number | Date>;

type TechniqueTranslator = (key: string, values?: TranslationValues) => string;

const NO_AST_FALLBACK_EN =
  "No AST is available to classify the technique safely.";

export function detectTechniqueFromAst(
  ast: AstNode | Program | null | undefined,
  sourceCode?: string,
  t?: TechniqueTranslator,
): TechniqueDetectionResult {
  if (!ast || typeof ast !== "object" || kindOf(ast as AstNode) === "unknown") {
    const noAstMsg = t?.("noAstForClassification") ?? NO_AST_FALLBACK_EN;
    return {
      technique: "unknown",
      confidence: "low",
      score: 1,
      secondarySignals: [],
      evidence: {
        compactSnippet: "",
        items: [],
        explanationFacts: [noAstMsg],
      },
      diagnostics: [noAstMsg],
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
