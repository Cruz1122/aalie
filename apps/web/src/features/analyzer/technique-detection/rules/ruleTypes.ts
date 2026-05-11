import type { TechniqueFacts } from "../analysis/collectFacts";
import type { Confidence, EvidenceItem, TechniqueId } from "../types";

export type RuleMatch = {
  technique: TechniqueId;
  matched: boolean;
  score: number;
  confidence: Confidence;
  evidenceItems: EvidenceItem[];
  secondarySignals: string[];
  diagnostics: string[];
};

export type TechniqueRule = {
  id: TechniqueId;
  priority: number;
  evaluate(facts: TechniqueFacts): RuleMatch;
};
