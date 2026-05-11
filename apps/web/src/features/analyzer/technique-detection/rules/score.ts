import type { Confidence } from "../types";

export function confidenceFromScore(score: number): Confidence {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function matched(score: number, min = 50): boolean {
  return score >= min;
}
