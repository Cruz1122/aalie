import { getSnippetById } from "@/features/analyzer/editor-support/catalog/snippetCatalog";

import { recommendationRules } from "./rules";
import type {
  GuidanceRecommendation,
  RecommendationCandidate,
  RecommendationRule,
} from "./types";
import type { EditorContext } from "../context/types";

export const MAX_RECOMMENDATIONS = 4;

function isAvailable(candidate: RecommendationCandidate): boolean {
  if (!candidate.snippetId) return true;
  const snippet = getSnippetById(candidate.snippetId);
  return Boolean(snippet && snippet.status !== "hidden");
}

export function rankRecommendations(
  context: EditorContext,
  options: {
    readonly limit?: number;
    readonly rules?: readonly RecommendationRule[];
  } = {},
): GuidanceRecommendation[] {
  const candidates: RecommendationCandidate[] = [];
  const rules = options.rules ?? recommendationRules;

  for (const rule of rules) {
    if (!rule.matches(context)) continue;
    rule.recommendations.forEach((recommendation, candidateOrder) => {
      candidates.push({
        ...recommendation,
        ruleOrder: rule.order,
        candidateOrder,
      });
    });
  }

  const deduplicated = new Map<string, RecommendationCandidate>();
  for (const candidate of candidates) {
    if (!isAvailable(candidate)) continue;
    const key = candidate.id;
    const previous = deduplicated.get(key);
    if (!previous || candidate.priority > previous.priority)
      deduplicated.set(key, candidate);
  }

  const limit = Math.max(0, options.limit ?? MAX_RECOMMENDATIONS);
  return [...deduplicated.values()]
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.ruleOrder - right.ruleOrder ||
        left.candidateOrder - right.candidateOrder ||
        left.id.localeCompare(right.id),
    )
    .slice(0, limit)
    .map(
      ({
        ruleOrder: _ruleOrder,
        candidateOrder: _candidateOrder,
        ...recommendation
      }) => recommendation,
    );
}
