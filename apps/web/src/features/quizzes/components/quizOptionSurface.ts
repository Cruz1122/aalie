import type {
  QuizPair,
  QuizQuestion,
  QuizQuestionResult,
  StudentAnswer,
} from "@aa/types";

import type { QuizOptionState } from "./types";

/**
 * Quiz row surfaces. Uses Tailwind `!` so border/bg win over `.glass-card` shorthand
 * (defined after utilities in globals) and over `border-color: currentColor` on buttons.
 */
export function surfaceClassesForQuizOptionState(
  state: QuizOptionState,
): string {
  if (state === "correct") {
    return "!border-emerald-300/50 !bg-emerald-500/20 hover:!border-emerald-300/70 hover:!bg-emerald-500/30";
  }
  if (state === "incorrect") {
    return "!border-rose-300/50 !bg-rose-500/20 hover:!border-rose-300/70 hover:!bg-rose-500/30";
  }
  if (state === "partial") {
    return "!border-amber-300/50 !bg-amber-500/20 hover:!border-amber-300/70 hover:!bg-amber-500/30";
  }
  if (state === "selected") {
    return "!border-primary/50 !bg-primary/20 hover:!border-primary/70 hover:!bg-primary/30";
  }
  if (state === "revealed") {
    return "!border-amber-400/40 !bg-amber-500/10 hover:!border-amber-400/60 hover:!bg-amber-500/20";
  }
  if (state === "disabled") {
    return "!border-slate-600/70 !bg-slate-900/40 opacity-70";
  }
  return "!border-slate-500/50 !bg-white/5 hover:!border-slate-400/60 hover:!bg-white/10";
}

function getOrderedOptionIds(
  question: QuizQuestion,
  answer: StudentAnswer,
): string[] {
  if ("orderedOptionIds" in answer) {
    return (
      answer.orderedOptionIds ??
      (question.options ?? []).map((item) => item.optionId)
    );
  }
  return (question.options ?? []).map((item) => item.optionId);
}

function getPairs(answer: StudentAnswer): QuizPair[] {
  if ("pairs" in answer) {
    return answer.pairs ?? [];
  }
  return [];
}

/** Per optionId: position matches canonical order → correct, else incorrect. */
export function buildOrderingStateById(
  question: QuizQuestion,
  result: QuizQuestionResult,
): Record<string, QuizOptionState> {
  const student = getOrderedOptionIds(question, result.studentAnswer) ?? [];
  const correct =
    result.correctAnswer?.orderedOptionIds ??
    question.answer.orderedOptionIds ??
    [];
  const byId: Record<string, QuizOptionState> = {};

  for (const [i, id] of student.entries()) {
    if (!id) continue;
    const expected = correct[i];
    byId[id] =
      expected !== undefined && id === expected ? "correct" : "incorrect";
  }

  return byId;
}

/** Per left row: student's rightId matches canonical pair → correct, else incorrect. */
export function buildMatchRowStateByLeftId(
  question: QuizQuestion,
  result: QuizQuestionResult,
): Record<string, QuizOptionState> {
  const correctPairs =
    result.correctAnswer?.pairs ?? question.answer.pairs ?? [];
  const correctMap = Object.fromEntries(
    correctPairs.map((p) => [p.leftId, p.rightId]),
  );
  const studentMap = Object.fromEntries(
    getPairs(result.studentAnswer).map((p) => [p.leftId, p.rightId]),
  );
  const states: Record<string, QuizOptionState> = {};

  for (const left of question.leftItems ?? []) {
    const lid = left.leftId;
    if (!lid) continue;
    if (!(lid in correctMap)) continue;
    const expected = correctMap[lid];
    const got = studentMap[lid];
    if (got === undefined || got === "") {
      states[lid] = "incorrect";
    } else {
      states[lid] = got === expected ? "correct" : "incorrect";
    }
  }

  return states;
}
