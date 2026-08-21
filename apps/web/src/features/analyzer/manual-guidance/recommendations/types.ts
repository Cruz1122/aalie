import type { EditorContext } from "../context/types";

export type GuidanceIntent =
  | "start"
  | "parameter"
  | "statement"
  | "decision"
  | "loop"
  | "output"
  | "expression"
  | "wrap"
  | "analysis";

export type GuidanceAction = "insert" | "wrap" | "analyze";

export type GuidanceReason =
  | "empty-document"
  | "inside-body"
  | "inside-condition"
  | "inside-expression"
  | "selection"
  | "valid-program";

export interface GuidanceRecommendation {
  readonly id: string;
  readonly snippetId?: string;
  readonly intent: GuidanceIntent;
  readonly action: GuidanceAction;
  readonly priority: number;
  readonly reason: GuidanceReason;
}

export interface RecommendationCandidate extends GuidanceRecommendation {
  readonly ruleOrder: number;
  readonly candidateOrder: number;
}

export interface RecommendationRule {
  readonly id: string;
  readonly order: number;
  readonly matches: (context: EditorContext) => boolean;
  readonly recommendations: readonly Omit<
    RecommendationCandidate,
    "ruleOrder" | "candidateOrder"
  >[];
}
