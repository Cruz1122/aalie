import { rankRecommendations } from "./rankRecommendations";
import type { EditorContext } from "../context/types";
export {
  rankRecommendations,
  MAX_RECOMMENDATIONS,
} from "./rankRecommendations";
export { recommendationRules } from "./rules";
export {
  isRecommendationCurrent,
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
  return rankRecommendations(context, options);
}
