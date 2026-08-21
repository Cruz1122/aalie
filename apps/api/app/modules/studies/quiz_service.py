from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.models.mf3 import (
    StudyParticipant,
    StudyQuizAttempt,
    StudyQuizAttemptItem,
    StudyQuizProgress,
)
from ..quizzes.repository import get_active_questions, get_question, get_validated_dataset
from ..quizzes.schemas import (
    QuizAnswerSubmission,
    QuizQuestion,
    QuizSelectionRequest,
    QuizSession,
    QuizSessionResult,
)
from ..quizzes.selector import select_questions
from ..quizzes.service import _sanitize_question, _shuffle_question_for_session, evaluate_session
from .constants import QUIZ_GRADING_VERSION, QUIZ_PROGRESS_VERSION, QUIZ_SELECTOR_VERSION
from .service import require_recording_participant


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _canonical_sha(value: object) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _question_sha(question: QuizQuestion) -> str:
    return _canonical_sha(question.model_dump(mode="json"))


def _dataset_sha(locale: str) -> str:
    dataset, _ = get_validated_dataset(locale)
    return _canonical_sha(dataset.model_dump(mode="json"))


def _get_or_create_progress(db: Session, participant_id: UUID) -> StudyQuizProgress:
    progress = db.get(StudyQuizProgress, participant_id)
    if progress is None:
        progress = StudyQuizProgress(
            participant_id=participant_id,
            revision=0,
            mastery_by_skill={},
            recent_question_ids=[],
            weak_skill_ids=[],
            last_failed_skill_ids=[],
            last_failed_topic_ids=[],
        )
        db.add(progress)
        db.flush()
    return progress


def _recent_results(db: Session, participant_id: UUID, limit: int = 50) -> list[dict[str, object]]:
    rows = list(
        db.execute(
            select(StudyQuizAttemptItem, StudyQuizAttempt.submitted_at)
            .join(StudyQuizAttempt, StudyQuizAttempt.id == StudyQuizAttemptItem.attempt_id)
            .where(
                StudyQuizAttempt.participant_id == participant_id,
                StudyQuizAttempt.status == "SUBMITTED",
                StudyQuizAttemptItem.is_correct.is_not(None),
            )
            .order_by(StudyQuizAttempt.submitted_at.desc(), StudyQuizAttemptItem.position.desc())
            .limit(limit)
        )
    )
    rows.reverse()
    return [
        {
            "questionId": item.question_id,
            "topic": item.topic,
            "difficulty": item.difficulty,
            "type": item.question_type,
            "wasCorrect": bool(item.is_correct),
        }
        for item, _submitted_at in rows
    ]


def _server_selection_request(
    payload: QuizSelectionRequest,
    *,
    progress: StudyQuizProgress,
    recent_results: list[dict[str, object]],
) -> QuizSelectionRequest:
    return QuizSelectionRequest(
        studentId=None,
        studiedContentRefs=[],
        masteryBySkill=dict(progress.mastery_by_skill or {}),
        weakSkillIds=list(progress.weak_skill_ids or []),
        weakTopics=list(progress.last_failed_topic_ids or []),
        recentResults=recent_results,
        recentQuestionIds=list(progress.recent_question_ids or []),
        sessionPreferences=payload.sessionPreferences,
        locale=payload.locale,
    )


def create_study_quiz_session(
    db: Session,
    *,
    study_slug: str,
    user_id: str,
    payload: QuizSelectionRequest,
) -> QuizSession:
    _study, participant = require_recording_participant(
        db,
        study_slug=study_slug,
        user_id=user_id,
    )
    progress = _get_or_create_progress(db, participant.id)
    request = _server_selection_request(
        payload,
        progress=progress,
        recent_results=_recent_results(db, participant.id),
    )
    locale = request.locale or "es"
    dataset, report = get_validated_dataset(locale)
    if report.errors:
        raise HTTPException(status_code=503, detail="Quiz dataset is invalid")

    selection = select_questions(
        get_active_questions(locale),
        request,
        include_trace=True,
    )
    if not selection.questions:
        raise HTTPException(status_code=409, detail="No questions available for study quiz")

    session_id = f"quiz-session-{uuid4()}"
    trace_by_question = {
        item.questionId: str(
            (item.selectionReason or {}).get(
                "code",
                item.reasons[0] if item.reasons else "fallback_available_question",
            )
        )
        for item in selection.selectionTrace
    }

    shuffled_questions: list[QuizQuestion] = []
    attempt = StudyQuizAttempt(
        participant_id=participant.id,
        session_id=session_id,
        dataset_id=dataset.datasetId,
        dataset_schema_version=dataset.schemaVersion,
        taxonomy_version=dataset.taxonomyVersion,
        dataset_sha256=_dataset_sha(locale),
        app_build_sha=os.getenv("AALIE_BUILD_SHA", "")[:40] or None,
        selector_version=QUIZ_SELECTOR_VERSION,
        grading_version=QUIZ_GRADING_VERSION,
        progress_version=QUIZ_PROGRESS_VERSION,
        progress_revision_before=progress.revision,
        course_id=dataset.courseId,
        module_id=request.sessionPreferences.moduleId,
        locale=dataset.locale,
        status="STARTED",
        question_count=len(selection.questions),
    )
    db.add(attempt)
    db.flush()

    for position, question in enumerate(selection.questions):
        shuffled = _shuffle_question_for_session(question, session_id)
        shuffled_questions.append(_sanitize_question(shuffled))
        db.add(
            StudyQuizAttemptItem(
                attempt_id=attempt.id,
                position=position,
                question_id=question.questionId,
                question_version=question.questionVersion,
                question_fingerprint_sha256=_question_sha(question),
                topic=question.topic,
                difficulty=question.difficulty,
                question_type=question.type,
                cognitive_level=question.cognitiveLevel,
                skill_ids=list(question.skillIds),
                selection_reason_code=trace_by_question.get(
                    question.questionId, "fallback_available_question"
                ),
                option_order=[option.optionId for option in shuffled.options],
                left_item_order=[
                    item.leftId for item in shuffled.leftItems if item.leftId is not None
                ],
                right_item_order=[
                    item.rightId for item in shuffled.rightItems if item.rightId is not None
                ],
                max_score=float(question.gradingPolicy.maxScore),
            )
        )

    db.commit()
    return QuizSession(
        sessionId=session_id,
        schemaVersion=dataset.schemaVersion,
        locale=dataset.locale,
        courseId=dataset.courseId,
        questions=shuffled_questions,
        metadata={
            "selectionMode": "adaptive_deterministic_server",
            "selectorVersion": QUIZ_SELECTOR_VERSION,
            "warnings": selection.warnings,
        },
    )


def _load_attempt_for_update(
    db: Session,
    *,
    participant: StudyParticipant,
    session_id: str,
) -> StudyQuizAttempt:
    attempt = db.scalar(
        select(StudyQuizAttempt)
        .where(
            StudyQuizAttempt.session_id == session_id,
            StudyQuizAttempt.participant_id == participant.id,
        )
        .with_for_update()
    )
    if attempt is None:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if attempt.status == "INVALIDATED":
        raise HTTPException(status_code=409, detail="Quiz session is invalidated")
    return attempt


def _validate_current_question(item: StudyQuizAttemptItem, locale: str) -> QuizQuestion:
    question = get_question(item.question_id, locale)
    if question is None:
        raise HTTPException(status_code=409, detail="Quiz question no longer exists")
    if question.questionVersion != item.question_version or _question_sha(question) != (
        item.question_fingerprint_sha256
    ):
        raise HTTPException(
            status_code=409,
            detail="Quiz question changed after study session creation",
        )
    return question


def _sanitize_result_for_storage(result: QuizSessionResult) -> QuizSessionResult:
    """Keep the idempotent study result without persisting answer-key/explanation prose."""

    for item in result.results:
        item.correctAnswer = None
        item.optionFeedback = []
        item.explanation.blocks = []
        item.contentRefs = []
    return result


def evaluate_study_quiz_session(
    db: Session,
    *,
    study_slug: str,
    user_id: str,
    payload: QuizAnswerSubmission,
) -> QuizSessionResult:
    _study, participant = require_recording_participant(
        db,
        study_slug=study_slug,
        user_id=user_id,
    )
    attempt = _load_attempt_for_update(
        db,
        participant=participant,
        session_id=payload.sessionId,
    )
    if attempt.status == "SUBMITTED":
        if not attempt.result_json:
            raise HTTPException(status_code=500, detail="Persisted quiz result is missing")
        return QuizSessionResult.model_validate(attempt.result_json)

    items = list(
        db.scalars(
            select(StudyQuizAttemptItem)
            .where(StudyQuizAttemptItem.attempt_id == attempt.id)
            .order_by(StudyQuizAttemptItem.position)
        )
    )
    expected_ids = [item.question_id for item in items]
    provided_answer_ids = [answer.questionId for answer in payload.answers]
    if len(set(provided_answer_ids)) != len(provided_answer_ids):
        raise HTTPException(status_code=400, detail="Duplicate question answers are not allowed")
    if set(provided_answer_ids) != set(expected_ids):
        raise HTTPException(status_code=400, detail="Answers must match the issued study questions")

    for item in items:
        _validate_current_question(item, attempt.locale)

    authoritative_payload = QuizAnswerSubmission(
        sessionId=attempt.session_id,
        questionIds=expected_ids,
        answers=payload.answers,
        locale=attempt.locale,
    )
    result = _sanitize_result_for_storage(evaluate_session(authoritative_payload))
    result_by_id = {item.questionId: item for item in result.results}

    last_failed_skill_ids: set[str] = set()
    last_failed_topic_ids: set[str] = set()
    for item in items:
        question_result = result_by_id[item.question_id]
        item.score = float(question_result.score)
        item.max_score = float(question_result.maxScore)
        item.is_correct = bool(question_result.isCorrect)
        if not question_result.isCorrect:
            last_failed_skill_ids.update(question_result.skillIds)
            last_failed_topic_ids.add(item.topic)

    total_score = round(sum(float(item.score or 0.0) for item in items), 4)
    total_max = round(sum(float(item.max_score) for item in items), 4)
    if total_score != round(float(result.score), 4) or total_max != round(
        float(result.maxScore), 4
    ):
        raise HTTPException(status_code=500, detail="Persisted quiz item totals do not match grading")

    progress = _get_or_create_progress(db, participant.id)
    if progress.revision != attempt.progress_revision_before:
        raise HTTPException(
            status_code=409,
            detail="Adaptive progress changed while the quiz session was open",
        )

    next_mastery = dict(progress.mastery_by_skill or {})
    for skill, delta in result.masteryDeltaBySkill.items():
        base = float(next_mastery.get(skill, 0.5))
        next_mastery[skill] = max(0.0, min(1.0, base + float(delta)))

    progress.mastery_by_skill = next_mastery
    progress.recent_question_ids = (
        [item.question_id for item in items] + list(progress.recent_question_ids or [])
    )[:50]
    progress.weak_skill_ids = list(result.areasToImprove)
    progress.last_failed_skill_ids = sorted(last_failed_skill_ids)
    progress.last_failed_topic_ids = sorted(last_failed_topic_ids)
    progress.revision += 1
    progress.updated_at = _now()

    attempt.status = "SUBMITTED"
    attempt.submitted_at = _now()
    attempt.score = total_score
    attempt.max_score = total_max
    attempt.accuracy = round(float(result.accuracy), 4)
    attempt.result_json = result.model_dump(mode="json")

    db.commit()
    return result
