from __future__ import annotations

from collections import defaultdict

from .schemas import OptionFeedback, QuizQuestion, QuizQuestionResult, StudentAnswer


class GradingError(ValueError):
    pass


def _build_feedback(question: QuizQuestion, selected_ids: set[str]) -> list[OptionFeedback]:
    feedback: list[OptionFeedback] = []
    for option in question.options:
        if option.optionId in selected_ids:
            feedback.append(option.feedback)
    return feedback


def grade_all_or_nothing(question: QuizQuestion, answer: StudentAnswer) -> float:
    expected = set(question.answer.correctOptionIds or [])
    received = set(answer.selectedOptionIds or [])
    return question.gradingPolicy.maxScore if expected == received else 0.0


def grade_exact_set(question: QuizQuestion, answer: StudentAnswer) -> float:
    expected = set(question.answer.correctOptionIds or [])
    received = set(answer.selectedOptionIds or [])
    return question.gradingPolicy.maxScore if expected == received else 0.0


def grade_partial_credit(question: QuizQuestion, answer: StudentAnswer) -> float:
    expected = set(question.answer.correctOptionIds or [])
    received = set(answer.selectedOptionIds or [])
    if not expected:
        return 0.0

    correct_selected = len(expected & received)
    incorrect_selected = len(received - expected)
    penalty = question.gradingPolicy.penalty or 0
    raw = (correct_selected / len(expected)) - (incorrect_selected * penalty)
    bounded = max(question.gradingPolicy.minScore or 0, raw * question.gradingPolicy.maxScore)
    return max(0.0, bounded)


def grade_ordered_exact(question: QuizQuestion, answer: StudentAnswer) -> float:
    expected = question.answer.orderedOptionIds or []
    received = answer.orderedOptionIds or []
    return question.gradingPolicy.maxScore if expected == received else 0.0


def grade_pairwise(question: QuizQuestion, answer: StudentAnswer) -> float:
    expected_pairs = {(pair.leftId, pair.rightId) for pair in question.answer.pairs or []}
    received_pairs = {(pair.leftId, pair.rightId) for pair in answer.pairs or []}
    if not expected_pairs:
        return 0.0
    ratio = len(expected_pairs & received_pairs) / len(expected_pairs)
    return ratio * question.gradingPolicy.maxScore


def _validate_answer_shape(question: QuizQuestion, answer: StudentAnswer) -> None:
    if answer.questionId != question.questionId:
        raise GradingError("questionId mismatch")

    if question.type in {"single_choice", "multiple_choice", "true_false"}:
        if answer.selectedOptionIds is None:
            raise GradingError("selectedOptionIds required")
    elif question.type == "ordering":
        if answer.orderedOptionIds is None:
            raise GradingError("orderedOptionIds required")
    elif question.type == "match_pairs":
        if answer.pairs is None:
            raise GradingError("pairs required")


def grade_question(question: QuizQuestion, answer: StudentAnswer) -> QuizQuestionResult:
    _validate_answer_shape(question, answer)

    mode = question.gradingPolicy.mode
    if mode == "all_or_nothing":
        score = grade_all_or_nothing(question, answer)
    elif mode == "exact_set":
        score = grade_exact_set(question, answer)
    elif mode == "partial_credit":
        score = grade_partial_credit(question, answer)
    elif mode == "ordered_exact":
        score = grade_ordered_exact(question, answer)
    elif mode == "pairwise":
        score = grade_pairwise(question, answer)
    else:
        raise GradingError(f"Unsupported grading mode: {mode}")

    max_score = question.gradingPolicy.maxScore
    is_correct = abs(score - max_score) < 1e-9

    selected_ids = set(answer.selectedOptionIds or [])
    if question.type == "ordering":
        selected_ids = set(answer.orderedOptionIds or [])

    return QuizQuestionResult(
        questionId=question.questionId,
        isCorrect=is_correct,
        score=score,
        maxScore=max_score,
        studentAnswer=answer,
        correctAnswer=question.answer,
        optionFeedback=_build_feedback(question, selected_ids),
        explanation=question.explanation,
        contentRefs=question.contentRefs,
        skillIds=question.skillIds,
    )


def compute_mastery_delta(question: QuizQuestion, result: QuizQuestionResult) -> dict[str, float]:
    if result.maxScore <= 0:
        ratio = 0.0
    else:
        ratio = max(0.0, min(1.0, result.score / result.maxScore))

    if ratio >= 0.999:
        delta = 0.05
    elif ratio <= 0.001:
        delta = -0.03
    else:
        delta = (0.05 * ratio) + (-0.03 * (1 - ratio))

    return {skill: delta for skill in question.skillIds}


def summarize_skill_outcomes(results: list[QuizQuestionResult]) -> tuple[list[str], list[str]]:
    bucket: dict[str, list[float]] = defaultdict(list)
    for result in results:
        ratio = (result.score / result.maxScore) if result.maxScore else 0.0
        for skill in result.skillIds:
            bucket[skill].append(ratio)

    strengths: list[str] = []
    improve: list[str] = []
    for skill, values in bucket.items():
        avg = sum(values) / len(values)
        if avg >= 0.75:
            strengths.append(skill)
        elif avg <= 0.5:
            improve.append(skill)

    strengths.sort()
    improve.sort()
    return strengths, improve
