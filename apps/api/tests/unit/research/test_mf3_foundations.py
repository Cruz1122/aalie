from __future__ import annotations

import hashlib
import io
import json
import zipfile
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, select

from app.core.database import get_session_factory
from app.db.models.mf3 import (
    RateLimitBucket,
    Study,
    StudyIdentityLink,
    StudyQuizAttempt,
    StudyQuizAttemptItem,
)
from app.modules.quizzes.repository import get_question
from app.modules.quizzes.schemas import (
    QuizAnswerSubmission,
    QuizSelectionRequest,
    QuizSessionPreferences,
    StudentAnswer,
)
from app.modules.quizzes.selector import _difficulty_plan
from app.modules.rate_limits.service import consume_rate_limit
from app.modules.studies.export_service import build_study_export
from app.modules.studies.quiz_service import (
    create_study_quiz_session,
    evaluate_study_quiz_session,
)
from app.modules.studies.schemas import (
    StudyCreateRequest,
)
from app.modules.studies.service import (
    assign_condition,
    consent_to_study,
    create_study,
    get_participant_for_user,
    update_study_status,
    withdraw_from_study,
)
from app.modules.studies.telemetry import event_for_path

pytestmark = [pytest.mark.fast, pytest.mark.unit]


def _new_active_study(db, *, slug_prefix: str = "mf3") -> Study:
    study = create_study(
        db,
        StudyCreateRequest(
            slug=f"{slug_prefix}-{uuid4().hex[:12]}",
            title="MF3 integration study",
            protocolVersion="1.0.0",
            consentVersion="1.0.0",
            consentSha256="a" * 64,
        ),
    )
    return update_study_status(db, study=study, new_status="ACTIVE", telemetry_enabled=True)


def _cleanup_study(study_id) -> None:
    factory = get_session_factory()
    with factory() as db:
        study = db.get(Study, study_id)
        if study is not None:
            db.delete(study)
            db.commit()


def _correct_answer(question_id: str, locale: str) -> StudentAnswer:
    question = get_question(question_id, locale)
    assert question is not None
    if question.answer.orderedOptionIds:
        return StudentAnswer(
            questionId=question_id,
            orderedOptionIds=list(question.answer.orderedOptionIds),
        )
    if question.answer.pairs:
        return StudentAnswer(
            questionId=question_id,
            pairs=list(question.answer.pairs),
        )
    return StudentAnswer(
        questionId=question_id,
        selectedOptionIds=list(question.answer.correctOptionIds or []),
    )


def test_difficulty_mix_uses_deterministic_largest_remainder() -> None:
    plan = _difficulty_plan(
        {"basic": 0.4, "intermediate": 0.4, "advanced": 0.2},
        5,
    )
    assert plan == ["basic", "intermediate", "advanced", "basic", "intermediate"]
    assert plan.count("basic") == 2
    assert plan.count("intermediate") == 2
    assert plan.count("advanced") == 1


def test_rate_limit_is_atomic_under_concurrency(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AALIE_RATE_LIMIT_ANALYSIS_ANON", "5")
    subject_hash = hashlib.sha256(uuid4().bytes).hexdigest()
    factory = get_session_factory()

    def consume() -> bool:
        with factory() as db:
            return consume_rate_limit(
                db,
                scope="analysis",
                subject_hash=subject_hash,
                authenticated=False,
            ).allowed

    try:
        with ThreadPoolExecutor(max_workers=10) as pool:
            allowed = list(pool.map(lambda _: consume(), range(10)))
        assert sum(allowed) == 5
        with factory() as db:
            bucket = db.get(RateLimitBucket, ("analysis", subject_hash))
            assert bucket is not None
            assert bucket.request_count == 10
    finally:
        with factory() as db:
            db.execute(
                delete(RateLimitBucket).where(
                    RateLimitBucket.scope == "analysis",
                    RateLimitBucket.subject_hash == subject_hash,
                )
            )
            db.commit()


def test_login_identity_does_not_create_participant_until_consent() -> None:
    factory = get_session_factory()
    study_id = None
    user_id = f"user-{uuid4()}"
    try:
        with factory() as db:
            study = _new_active_study(db)
            study_id = study.id
            assert get_participant_for_user(db, study_id=study.id, user_id=user_id) is None
            assert (
                db.scalar(
                    select(StudyIdentityLink).where(StudyIdentityLink.auth_user_id == user_id)
                )
                is None
            )

            participant = consent_to_study(db, study=study, user_id=user_id)
            assert participant.condition is None
            assert get_participant_for_user(db, study_id=study.id, user_id=user_id) is not None

            participant = assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="AALIE",
            )
            assert participant.condition == "AALIE"

            withdrawn = withdraw_from_study(db, study=study, user_id=user_id)
            assert withdrawn.withdrawn_at is not None
            with pytest.raises(HTTPException) as exc:
                consent_to_study(db, study=study, user_id=user_id)
            assert exc.value.status_code == 409
    finally:
        if study_id is not None:
            _cleanup_study(study_id)


def test_closed_study_cannot_be_reopened() -> None:
    factory = get_session_factory()
    study_id = None
    try:
        with factory() as db:
            study = _new_active_study(db, slug_prefix="closed")
            study_id = study.id
            study = update_study_status(
                db, study=study, new_status="CLOSED", telemetry_enabled=False
            )
            assert study.telemetry_enabled is False
            with pytest.raises(HTTPException) as exc:
                update_study_status(
                    db, study=study, new_status="ACTIVE", telemetry_enabled=True
                )
            assert exc.value.status_code == 409
    finally:
        if study_id is not None:
            _cleanup_study(study_id)


def test_study_quiz_ignores_client_mastery_and_persists_authoritative_grades() -> None:
    factory = get_session_factory()
    study_id = None
    user_id = f"quiz-user-{uuid4()}"
    try:
        with factory() as db:
            study = _new_active_study(db, slug_prefix="quiz")
            study_id = study.id
            participant = consent_to_study(db, study=study, user_id=user_id)
            assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="AALIE",
            )

            base_preferences = QuizSessionPreferences(questionCount=3)
            first = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    masteryBySkill={"tampered.skill": 0.0},
                    weakSkillIds=["tampered.skill"],
                    recentQuestionIds=["fake-question"],
                    sessionPreferences=base_preferences,
                    locale="es",
                ),
            )
            second = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    masteryBySkill={"tampered.skill": 1.0},
                    weakSkillIds=[],
                    recentQuestionIds=[],
                    sessionPreferences=base_preferences,
                    locale="es",
                ),
            )
            assert [q.questionId for q in first.questions] == [
                q.questionId for q in second.questions
            ]

            attempt = db.scalar(
                select(StudyQuizAttempt).where(StudyQuizAttempt.session_id == first.sessionId)
            )
            assert attempt is not None
            persisted_items = list(
                db.scalars(
                    select(StudyQuizAttemptItem)
                    .where(StudyQuizAttemptItem.attempt_id == attempt.id)
                    .order_by(StudyQuizAttemptItem.position)
                )
            )
            assert [item.question_id for item in persisted_items] == [
                q.questionId for q in first.questions
            ]
            assert all(len(item.question_fingerprint_sha256) == 64 for item in persisted_items)

            answers = [_correct_answer(q.questionId, first.locale) for q in first.questions]
            result = evaluate_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizAnswerSubmission(
                    sessionId=first.sessionId,
                    questionIds=["client-question-ids-are-not-authoritative"],
                    answers=answers,
                    locale=first.locale,
                ),
            )
            assert result.score == result.maxScore

            persisted = db.scalar(
                select(StudyQuizAttempt).where(StudyQuizAttempt.session_id == first.sessionId)
            )
            assert persisted is not None
            assert persisted.status == "SUBMITTED"
            items = list(
                db.scalars(
                    select(StudyQuizAttemptItem).where(
                        StudyQuizAttemptItem.attempt_id == persisted.id
                    )
                )
            )
            assert round(sum(float(item.score or 0) for item in items), 4) == persisted.score
            assert all(item.is_correct is True for item in items)

            duplicate = evaluate_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizAnswerSubmission(
                    sessionId=first.sessionId,
                    questionIds=[],
                    answers=answers,
                    locale=first.locale,
                ),
            )
            assert duplicate.model_dump(mode="json") == result.model_dump(mode="json")

            second_answers = [_correct_answer(q.questionId, second.locale) for q in second.questions]
            with pytest.raises(HTTPException) as conflict:
                evaluate_study_quiz_session(
                    db,
                    study_slug=study.slug,
                    user_id=user_id,
                    payload=QuizAnswerSubmission(
                        sessionId=second.sessionId,
                        questionIds=[],
                        answers=second_answers,
                        locale=second.locale,
                    ),
                )
            assert conflict.value.status_code == 409
    finally:
        if study_id is not None:
            _cleanup_study(study_id)


def test_condition_is_immutable_after_quiz_evidence() -> None:
    factory = get_session_factory()
    study_id = None
    user_id = f"condition-user-{uuid4()}"
    try:
        with factory() as db:
            study = _new_active_study(db, slug_prefix="condition")
            study_id = study.id
            participant = consent_to_study(db, study=study, user_id=user_id)
            assign_condition(
                db, study=study, participant_id=participant.id, condition="AALIE"
            )
            create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=1),
                    locale="es",
                ),
            )
            with pytest.raises(HTTPException) as exc:
                assign_condition(
                    db,
                    study=study,
                    participant_id=participant.id,
                    condition="CONTROL",
                )
            assert exc.value.status_code == 409
    finally:
        if study_id is not None:
            _cleanup_study(study_id)


def test_research_export_is_pseudonymized_and_hashes_payload_files() -> None:
    factory = get_session_factory()
    study_id = None
    secret_user = f"named-user-{uuid4()}@example.edu"
    try:
        with factory() as db:
            study = _new_active_study(db, slug_prefix="export")
            study_id = study.id
            participant = consent_to_study(db, study=study, user_id=secret_user)
            assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="CONTROL",
            )

        export = build_study_export(study_id)
        assert secret_user.encode() not in export.archive
        assert len(export.sha256) == 64

        with zipfile.ZipFile(io.BytesIO(export.archive)) as archive:
            expected = {
                "manifest.json",
                "participants.csv",
                "quiz_attempts.csv",
                "quiz_items.csv",
                "events.csv",
                "measurements.csv",
                "data_dictionary.json",
            }
            assert set(archive.namelist()) == expected
            manifest = json.loads(archive.read("manifest.json"))
            for filename, declared in manifest["files"].items():
                actual = hashlib.sha256(archive.read(filename)).hexdigest()
                assert declared == f"sha256:{actual}"

            combined = b"\n".join(archive.read(name) for name in expected)
            for forbidden in (
                b"auth_user_id",
                b"email",
                b"user_agent",
                b"source_code",
                b"prompt",
            ):
                assert forbidden not in combined.lower()
    finally:
        if study_id is not None:
            _cleanup_study(study_id)


@pytest.mark.parametrize(
    ("path", "event"),
    [
        ("/analyze/open", "analysis_run"),
        ("/analyze/trace", "trace_run"),
        ("/export/report", "export_run"),
        ("/llm", "llm_run"),
        ("/llm/classify", "llm_run"),
        ("/quizzes/attempts", None),
    ],
)
def test_telemetry_path_allowlist(path: str, event: str | None) -> None:
    assert event_for_path(path) == event
