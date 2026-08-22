import type { EditorContext } from "../context/types";
import type { GuidanceRecommendation } from "../recommendations/types";

export function getContextTitleKey(context: EditorContext): string {
  const keys: Record<EditorContext["location"]["primary"], string> = {
    EMPTY_DOCUMENT: "context.empty.title",
    TOP_LEVEL: "context.topLevel.title",
    PROCEDURE_SIGNATURE: "context.signature.title",
    PARAMETER_LIST: "context.parameters.title",
    PROCEDURE_BODY: "context.body.title",
    CONDITION: "context.condition.title",
    EXPRESSION: "context.expression.title",
    IF_BODY: "context.ifBody.title",
    LOOP_BODY: "context.loopBody.title",
    RETURN_EXPRESSION: "context.return.title",
    SELECTION: "context.selection.title",
    UNKNOWN: "context.unknown.title",
  };
  return keys[context.location.primary];
}

export function getRecommendationTitleKey(
  recommendation: GuidanceRecommendation,
): string {
  return `recommendations.${recommendation.id}.title`;
}

export function getRecommendationDescriptionKey(
  recommendation: GuidanceRecommendation,
): string {
  return `recommendations.${recommendation.id}.description`;
}
