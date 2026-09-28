import { rankRecommendations } from "./rankRecommendations";
import type { EditorContext } from "../context/types";
export {
  rankRecommendations,
  MAX_RECOMMENDATIONS,
} from "./rankRecommendations";
export { adjustRecommendationPriority, recommendationRules } from "./rules";
export {
  isRecommendationCurrent,
  personalizeSnippet,
  resolveRecommendationInsertion,
  type RecommendationInsertion,
} from "./resolveRecommendationInsertion";
export type {
  GuidanceAction,
  GuidanceIntent,
  GuidanceReason,
  GuidanceRecommendation,
  RecommendationCandidate,
  RecommendationRule,
} from "./types";

export function getContextualRecommendations(
  context: EditorContext,
  options: {
    readonly limit?: number;
    readonly rules?: import("./types").RecommendationRule[];
  } = {},
) {
  if (context.selection.origin === "placeholder") return [];
  return rankRecommendations(context, options);
}
