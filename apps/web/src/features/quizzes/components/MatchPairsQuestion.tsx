"use client";

import type { QuizPair, QuizQuestion } from "@aa/types";

import { DefinitionsConceptsQuestion } from "./DefinitionsConceptsQuestion";

interface Props {
  question: QuizQuestion;
  value: QuizPair[];
  onChange: (value: QuizPair[]) => void;
  disabled?: boolean;
}

/**
 * Backward-compatible alias for match-pairs questions.
 * Current UI implementation lives in DefinitionsConceptsQuestion.
 */
export function MatchPairsQuestion(props: Props) {
  return <DefinitionsConceptsQuestion {...props} />;
}

