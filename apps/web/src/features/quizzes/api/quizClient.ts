import type {
  QuizAnswerSubmission,
  QuizAttempt,
  QuizAttemptResult,
  QuizSelectionRequest,
  QuizSession,
  QuizSessionEvaluateRequest,
  QuizSessionResult,
} from "@aa/types";

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const detail =
      data && typeof data === "object"
        ? JSON.stringify(data)
        : response.statusText;
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }
  if (!data) {
    throw new Error("Invalid JSON response");
  }
  return data;
}

export async function createQuizSession(
  payload: QuizSelectionRequest,
): Promise<QuizSession> {
  const response = await fetch("/api/quizzes/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<QuizSession>(response);
}

export async function createQuizAttempt(
  payload: QuizSelectionRequest,
): Promise<QuizAttempt> {
  return createQuizSession(payload);
}

export async function evaluateQuizSession(
  payload: QuizSessionEvaluateRequest,
): Promise<QuizSessionResult> {
  const response = await fetch("/api/quizzes/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<QuizSessionResult>(response);
}

export async function evaluateQuizAttempt(
  payload: QuizAnswerSubmission,
): Promise<QuizAttemptResult> {
  return evaluateQuizSession(payload);
}

export async function getQuizTaxonomy(): Promise<unknown> {
  const response = await fetch("/api/quizzes/taxonomy", { cache: "no-store" });
  return parseJsonOrThrow<unknown>(response);
}

export async function getQuizSummary(): Promise<unknown> {
  const response = await fetch("/api/quizzes/summary", { cache: "no-store" });
  return parseJsonOrThrow<unknown>(response);
}
