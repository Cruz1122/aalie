/**
 * A module is "quiz-eligible" when its reading progress >= the given threshold
 * (default: 90%). The caller passes `progress` as a 0-100 integer.
 */
export const DEFAULT_QUIZ_ELIGIBILITY_THRESHOLD = 90;

export function isModuleQuizEligible(
  progress: number,
  threshold = DEFAULT_QUIZ_ELIGIBILITY_THRESHOLD,
): boolean {
  return progress >= threshold;
}
