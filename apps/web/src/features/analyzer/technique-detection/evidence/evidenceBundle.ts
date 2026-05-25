import type { TechniqueFacts } from "../analysis/collectFacts";
import type { RuleMatch } from "../rules/ruleTypes";
import type { TechniqueEvidenceBundle } from "../types";
import { explainEvidence } from "./explainEvidence";
import { buildCompactSnippet } from "./snippetBuilder";

type TranslationValues = Record<string, string | number | Date>;

type TechniqueTranslator = (key: string, values?: TranslationValues) => string;

export function buildEvidenceBundle(
  facts: TechniqueFacts,
  match: RuleMatch,
  t?: TechniqueTranslator,
  sourceCode?: string,
): TechniqueEvidenceBundle {
  const compactSnippet = buildCompactSnippet(
    facts,
    match.evidenceItems,
    sourceCode,
  );
  const explanationFacts = explainEvidence(match, t);

  return {
    compactSnippet,
    items: match.evidenceItems,
    explanationFacts,
  };
}
