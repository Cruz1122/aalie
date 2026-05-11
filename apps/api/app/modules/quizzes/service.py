from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
import random
from uuid import uuid4

from .grading import GradingError, compute_mastery_delta, grade_question, summarize_skill_outcomes
from .repository import (
    get_active_questions,
    get_question,
    get_validated_dataset,
    normalize_quiz_locale,
)
from .schemas import (
    QuizAnswerSubmission,
    QuizQuestion,
    QuizSelectionRequest,
    QuizSession,
    QuizSessionResult,
)
from .selector import select_questions


def _sanitize_question(question: QuizQuestion) -> QuizQuestion:
    question_copy = deepcopy(question)
    question_copy.answer.correctOptionIds = None
    question_copy.answer.orderedOptionIds = None
    question_copy.answer.pairs = None
    return question_copy


def _shuffle_question_for_session(question: QuizQuestion, session_seed: str) -> QuizQuestion:
    shuffled = deepcopy(question)
    rng = random.Random(f"{session_seed}:{question.questionId}")
    rng.shuffle(shuffled.options)
    rng.shuffle(shuffled.leftItems)
    rng.shuffle(shuffled.rightItems)
    return shuffled


def get_health() -> dict[str, object]:
    dataset, report = get_validated_dataset()
    active_count = len([q for q in dataset.questions if q.status == "active"])
    return {
        "ok": len(report.errors) == 0,
        "datasetId": dataset.datasetId,
        "schemaVersion": dataset.schemaVersion,
        "activeQuestions": active_count,
        "warnings": len(report.warnings),
        "errors": len(report.errors),
    }


def get_dataset_summary() -> dict[str, dict[str, int]]:
    dataset, _ = get_validated_dataset()

    by_topic: dict[str, int] = defaultdict(int)
    by_difficulty: dict[str, int] = defaultdict(int)
    by_cognitive: dict[str, int] = defaultdict(int)
    by_status: dict[str, int] = defaultdict(int)

    for question in dataset.questions:
        by_topic[question.topic] += 1
        by_difficulty[question.difficulty] += 1
        by_cognitive[question.cognitiveLevel] += 1
        by_status[question.status] += 1

    return {
        "byTopic": dict(sorted(by_topic.items())),
        "byDifficulty": dict(sorted(by_difficulty.items())),
        "byCognitiveLevel": dict(sorted(by_cognitive.items())),
        "byStatus": dict(sorted(by_status.items())),
    }


def create_session(request: QuizSelectionRequest) -> QuizSession:
    loc = normalize_quiz_locale(request.locale)
    dataset, report = get_validated_dataset(loc)
    if report.errors:
        raise ValueError("Quiz dataset invalido; corra /quizzes/validate")

    selection = select_questions(get_active_questions(loc), request, include_trace=False)
    session_id = f"quiz-session-{uuid4()}"
    sanitized_questions = [
        _sanitize_question(_shuffle_question_for_session(question, session_id))
        for question in selection.questions
    ]

    return QuizSession(
        sessionId=session_id,
        schemaVersion=dataset.schemaVersion,
        locale=dataset.locale,
        courseId=dataset.courseId,
        questions=sanitized_questions,
        metadata={
            "selectionMode": "adaptive_deterministic",
            "warnings": selection.warnings,
        },
    )


def evaluate_session(payload: QuizAnswerSubmission) -> QuizSessionResult:
    loc = normalize_quiz_locale(payload.locale)
    answers_by_id = {answer.questionId: answer for answer in payload.answers}

    results = []
    mastery_delta_by_skill: dict[str, float] = defaultdict(float)

    for question_id in payload.questionIds:
        question = get_question(question_id, loc)
        if question is None:
            raise ValueError(f"Unknown questionId: {question_id}")

        answer = answers_by_id.get(question_id)
        if answer is None:
            raise ValueError(f"Missing answer for questionId: {question_id}")

        try:
            result = grade_question(question, answer)
        except GradingError as exc:
            raise ValueError(str(exc)) from exc

        results.append(result)
        for skill, delta in compute_mastery_delta(question, result).items():
            mastery_delta_by_skill[skill] += delta

    score = sum(result.score for result in results)
    max_score = sum(result.maxScore for result in results)
    accuracy = (score / max_score) if max_score else 0.0

    strengths, areas_to_improve = summarize_skill_outcomes(results)

    return QuizSessionResult(
        sessionId=payload.sessionId,
        score=round(score, 4),
        maxScore=round(max_score, 4),
        accuracy=round(accuracy, 4),
        results=results,
        strengths=strengths,
        areasToImprove=areas_to_improve,
        masteryDeltaBySkill={k: round(v, 4) for k, v in sorted(mastery_delta_by_skill.items())},
    )
