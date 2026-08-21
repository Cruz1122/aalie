from __future__ import annotations

import csv
import hashlib
import io
import json
import zipfile
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute
from sqlalchemy import delete, select
from starlette.requests import Request

from app.core import auth
from app.core.database import get_session_factory
from app.db.models.mf3 import (
    RateLimitBucket,
    Study,
    StudyEvent,
    StudyExportAudit,
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
from app.modules.rate_limits.service import consume_rate_limit
from app.modules.studies import telemetry
from app.modules.studies.constants import (
    QUIZ_GRADING_VERSION,
    QUIZ_PROGRESS_VERSION,
    QUIZ_SELECTOR_VERSION,
)
from app.modules.studies.export_service import build_study_export, record_export_audit
from app.modules.studies.quiz_service import (
    create_study_quiz_session,
    evaluate_study_quiz_session,
)
from app.modules.studies.router import router as studies_router
from app.modules.studies.schemas import StudyCreateRequest, StudyMeasurementRequest
from app.modules.studies.service import (
    add_measurement,
    assign_condition,
    consent_to_study,
    create_study,
    require_recording_participant,
    update_study_status,
    withdraw_from_study,
)

pytestmark = [pytest.mark.fast, pytest.mark.unit]


def _active_study(db, *, prefix: str) -> Study:
    study = create_study(
        db,
        StudyCreateRequest(
            slug=f"{prefix}-{uuid4().hex[:12]}",
            title="MF3 gate study",
            protocolVersion="1.0.0",
            consentVersion="1.0.0",
            consentSha256="b" * 64,
        ),
    )
    return update_study_status(
        db,
        study=study,
        new_status="ACTIVE",
        telemetry_enabled=True,
    )


def _cleanup(*study_ids) -> None:
    factory = get_session_factory()
    with factory() as db:
        for study_id in study_ids:
            if study_id is None:
                continue
            study = db.get(Study, study_id)
            if study is not None:
                db.delete(study)
        db.commit()


def _answer(question_id: str, locale: str) -> StudentAnswer:
    question = get_question(question_id, locale)
    assert question is not None
    if question.answer.orderedOptionIds:
        return StudentAnswer(
            questionId=question_id,
            orderedOptionIds=list(question.answer.orderedOptionIds),
        )
    if question.answer.pairs:
        return StudentAnswer(questionId=question_id, pairs=list(question.answer.pairs))
    return StudentAnswer(
        questionId=question_id,
        selectedOptionIds=list(question.answer.correctOptionIds or []),
    )


def _request(*, slug: str | None, token: str | None = "test-token") -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if slug:
        headers.append((b"x-aalie-study-slug", slug.encode()))
    if token:
        headers.append((b"authorization", f"Bearer {token}".encode()))
    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/analyze/open",
            "raw_path": b"/analyze/open",
            "query_string": b"",
            "headers": headers,
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
            "root_path": "",
        }
    )


def test_rate_limit_distinguishes_subjects_uses_auth_quota_and_resets(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AALIE_RATE_LIMIT_PARSE_ANON", "1")
    monkeypatch.setenv("AALIE_RATE_LIMIT_PARSE_AUTH", "2")
    factory = get_session_factory()
    visitor_a = hashlib.sha256(uuid4().bytes).hexdigest()
    visitor_b = hashlib.sha256(uuid4().bytes).hexdigest()
    user = hashlib.sha256(uuid4().bytes).hexdigest()
    t0 = datetime.now(timezone.utc)

    try:
        with factory() as db:
            first = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=visitor_a,
                authenticated=False,
                now=t0,
            )
            second = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=visitor_a,
                authenticated=False,
                now=t0,
            )
            other_visitor = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=visitor_b,
                authenticated=False,
                now=t0,
            )
            auth_1 = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=user,
                authenticated=True,
                now=t0,
            )
            auth_2 = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=user,
                authenticated=True,
                now=t0,
            )
            auth_3 = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=user,
                authenticated=True,
                now=t0,
            )
            reset = consume_rate_limit(
                db,
                scope="parse",
                subject_hash=visitor_a,
                authenticated=False,
                now=t0 + timedelta(seconds=61),
            )

            assert first.allowed is True
            assert second.allowed is False
            assert second.retry_after_seconds > 0
            assert other_visitor.allowed is True
            assert [auth_1.allowed, auth_2.allowed, auth_3.allowed] == [True, True, False]
            assert reset.allowed is True
            bucket = db.get(RateLimitBucket, ("parse", visitor_a))
            assert bucket is not None
            assert bucket.request_count == 1
    finally:
        with factory() as db:
            db.execute(
                delete(RateLimitBucket).where(
                    RateLimitBucket.scope == "parse",
                    RateLimitBucket.subject_hash.in_([visitor_a, visitor_b, user]),
                )
            )
            db.commit()


def test_consent_is_idempotent_per_study_but_separate_between_studies() -> None:
    factory = get_session_factory()
    ids: list[object] = []
    user_id = f"consent-{uuid4()}"
    try:
        with factory() as db:
            first_study = _active_study(db, prefix="consent-a")
            second_study = _active_study(db, prefix="consent-b")
            ids.extend([first_study.id, second_study.id])

            first = consent_to_study(db, study=first_study, user_id=user_id)
            repeated = consent_to_study(db, study=first_study, user_id=user_id)
            second = consent_to_study(db, study=second_study, user_id=user_id)

            assert repeated.id == first.id
            assert second.id != first.id
            assert first.condition is None
            assert second.condition is None
    finally:
        _cleanup(*ids)


def test_no_experimental_recording_when_condition_missing_paused_closed_or_withdrawn() -> None:
    factory = get_session_factory()
    ids: list[object] = []
    try:
        with factory() as db:
            null_study = _active_study(db, prefix="null-condition")
            ids.append(null_study.id)
            null_user = f"null-{uuid4()}"
            consent_to_study(db, study=null_study, user_id=null_user)
            with pytest.raises(HTTPException) as missing_condition:
                require_recording_participant(
                    db, study_slug=null_study.slug, user_id=null_user
                )
            assert missing_condition.value.status_code == 409

            paused_study = _active_study(db, prefix="paused")
            ids.append(paused_study.id)
            paused_user = f"paused-{uuid4()}"
            participant = consent_to_study(db, study=paused_study, user_id=paused_user)
            assign_condition(
                db,
                study=paused_study,
                participant_id=participant.id,
                condition="AALIE",
            )
            paused_study = update_study_status(
                db,
                study=paused_study,
                new_status="PAUSED",
                telemetry_enabled=True,
            )
            with pytest.raises(HTTPException) as paused:
                require_recording_participant(
                    db, study_slug=paused_study.slug, user_id=paused_user
                )
            assert paused.value.status_code == 409

            closed_study = _active_study(db, prefix="closed-recording")
            ids.append(closed_study.id)
            closed_user = f"closed-{uuid4()}"
            participant = consent_to_study(db, study=closed_study, user_id=closed_user)
            assign_condition(
                db,
                study=closed_study,
                participant_id=participant.id,
                condition="CONTROL",
            )
            closed_study = update_study_status(
                db,
                study=closed_study,
                new_status="CLOSED",
                telemetry_enabled=False,
            )
            with pytest.raises(HTTPException) as closed:
                require_recording_participant(
                    db, study_slug=closed_study.slug, user_id=closed_user
                )
            assert closed.value.status_code == 409

            withdrawn_study = _active_study(db, prefix="withdrawn-recording")
            ids.append(withdrawn_study.id)
            withdrawn_user = f"withdrawn-{uuid4()}"
            participant = consent_to_study(
                db, study=withdrawn_study, user_id=withdrawn_user
            )
            assign_condition(
                db,
                study=withdrawn_study,
                participant_id=participant.id,
                condition="AALIE",
            )
            withdraw_from_study(db, study=withdrawn_study, user_id=withdrawn_user)
            with pytest.raises(HTTPException) as withdrawn:
                require_recording_participant(
                    db, study_slug=withdrawn_study.slug, user_id=withdrawn_user
                )
            assert withdrawn.value.status_code == 403
    finally:
        _cleanup(*ids)


def test_condition_is_immutable_after_measurement_or_telemetry_evidence() -> None:
    factory = get_session_factory()
    ids: list[object] = []
    try:
        with factory() as db:
            measurement_study = _active_study(db, prefix="measurement-evidence")
            ids.append(measurement_study.id)
            participant = consent_to_study(
                db, study=measurement_study, user_id=f"measure-{uuid4()}"
            )
            participant = assign_condition(
                db,
                study=measurement_study,
                participant_id=participant.id,
                condition="AALIE",
            )
            add_measurement(
                db,
                participant=participant,
                payload=StudyMeasurementRequest(
                    metricKey="pretest_score",
                    metricVersion="1",
                    phase="pre",
                    numericValue=8.0,
                    unit="points",
                ),
            )
            with pytest.raises(HTTPException) as measurement_conflict:
                assign_condition(
                    db,
                    study=measurement_study,
                    participant_id=participant.id,
                    condition="CONTROL",
                )
            assert measurement_conflict.value.status_code == 409

            event_study = _active_study(db, prefix="event-evidence")
            ids.append(event_study.id)
            participant = consent_to_study(
                db, study=event_study, user_id=f"event-{uuid4()}"
            )
            participant = assign_condition(
                db,
                study=event_study,
                participant_id=participant.id,
                condition="AALIE",
            )
            db.add(
                StudyEvent(
                    participant_id=participant.id,
                    event_name="analysis_run",
                    event_version="1",
                    source="SERVER",
                    success=True,
                    duration_ms=1,
                )
            )
            db.commit()
            with pytest.raises(HTTPException) as event_conflict:
                assign_condition(
                    db,
                    study=event_study,
                    participant_id=participant.id,
                    condition="CONTROL",
                )
            assert event_conflict.value.status_code == 409
    finally:
        _cleanup(*ids)


def test_study_quiz_enforces_ownership_issued_set_and_question_fingerprint() -> None:
    factory = get_session_factory()
    study_id = None
    try:
        with factory() as db:
            study = _active_study(db, prefix="quiz-integrity")
            study_id = study.id
            owner = f"owner-{uuid4()}"
            other = f"other-{uuid4()}"
            for user in (owner, other):
                participant = consent_to_study(db, study=study, user_id=user)
                assign_condition(
                    db,
                    study=study,
                    participant_id=participant.id,
                    condition="AALIE",
                )

            session = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=owner,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=2),
                    locale="es",
                ),
            )
            attempt = db.scalar(
                select(StudyQuizAttempt).where(
                    StudyQuizAttempt.session_id == session.sessionId
                )
            )
            assert attempt is not None
            assert attempt.status == "STARTED"
            assert attempt.selector_version == QUIZ_SELECTOR_VERSION
            assert attempt.grading_version == QUIZ_GRADING_VERSION
            assert attempt.progress_version == QUIZ_PROGRESS_VERSION
            items = list(
                db.scalars(
                    select(StudyQuizAttemptItem)
                    .where(StudyQuizAttemptItem.attempt_id == attempt.id)
                    .order_by(StudyQuizAttemptItem.position)
                )
            )
            assert len(items) == 2
            assert all(item.question_version >= 1 for item in items)
            assert all(len(item.question_fingerprint_sha256) == 64 for item in items)
            answers = [_answer(q.questionId, session.locale) for q in session.questions]

            with pytest.raises(HTTPException) as ownership:
                evaluate_study_quiz_session(
                    db,
                    study_slug=study.slug,
                    user_id=other,
                    payload=QuizAnswerSubmission(
                        sessionId=session.sessionId,
                        questionIds=[],
                        answers=answers,
                        locale=session.locale,
                    ),
                )
            assert ownership.value.status_code == 404

            fake_answers = list(answers)
            fake_answers[0] = StudentAnswer(
                questionId="not-issued-by-server",
                selectedOptionIds=[],
            )
            with pytest.raises(HTTPException) as fake_question:
                evaluate_study_quiz_session(
                    db,
                    study_slug=study.slug,
                    user_id=owner,
                    payload=QuizAnswerSubmission(
                        sessionId=session.sessionId,
                        questionIds=["ignored-client-list"],
                        answers=fake_answers,
                        locale=session.locale,
                    ),
                )
            assert fake_question.value.status_code == 400

            items[0].question_fingerprint_sha256 = "0" * 64
            db.commit()
            with pytest.raises(HTTPException) as fingerprint:
                evaluate_study_quiz_session(
                    db,
                    study_slug=study.slug,
                    user_id=owner,
                    payload=QuizAnswerSubmission(
                        sessionId=session.sessionId,
                        questionIds=[],
                        answers=answers,
                        locale=session.locale,
                    ),
                )
            assert fingerprint.value.status_code == 409
    finally:
        _cleanup(study_id)


def test_study_quiz_rejects_question_version_drift() -> None:
    factory = get_session_factory()
    study_id = None
    try:
        with factory() as db:
            study = _active_study(db, prefix="quiz-version")
            study_id = study.id
            user = f"version-{uuid4()}"
            participant = consent_to_study(db, study=study, user_id=user)
            assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="CONTROL",
            )
            session = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=1),
                    locale="es",
                ),
            )
            attempt = db.scalar(
                select(StudyQuizAttempt).where(
                    StudyQuizAttempt.session_id == session.sessionId
                )
            )
            assert attempt is not None
            item = db.scalar(
                select(StudyQuizAttemptItem).where(
                    StudyQuizAttemptItem.attempt_id == attempt.id
                )
            )
            assert item is not None
            item.question_version += 1
            db.commit()
            answers = [_answer(q.questionId, session.locale) for q in session.questions]
            with pytest.raises(HTTPException) as version:
                evaluate_study_quiz_session(
                    db,
                    study_slug=study.slug,
                    user_id=user,
                    payload=QuizAnswerSubmission(
                        sessionId=session.sessionId,
                        questionIds=[],
                        answers=answers,
                        locale=session.locale,
                    ),
                )
            assert version.value.status_code == 409
    finally:
        _cleanup(study_id)


def test_telemetry_requires_all_gates_and_never_propagates_failures(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    factory = get_session_factory()
    study_id = None
    try:
        with factory() as db:
            study = _active_study(db, prefix="telemetry-gates")
            study_id = study.id
            active_user = f"telemetry-active-{uuid4()}"
            active = consent_to_study(db, study=study, user_id=active_user)
            assign_condition(
                db,
                study=study,
                participant_id=active.id,
                condition="AALIE",
            )

            null_user = f"telemetry-null-{uuid4()}"
            consent_to_study(db, study=study, user_id=null_user)

            withdrawn_user = f"telemetry-withdrawn-{uuid4()}"
            withdrawn = consent_to_study(db, study=study, user_id=withdrawn_user)
            assign_condition(
                db,
                study=study,
                participant_id=withdrawn.id,
                condition="CONTROL",
            )
            withdraw_from_study(db, study=study, user_id=withdrawn_user)

        identities = {
            "active": auth.IdentityClaims(user_id=active_user, role="USER"),
            "null": auth.IdentityClaims(user_id=null_user, role="USER"),
            "withdrawn": auth.IdentityClaims(user_id=withdrawn_user, role="USER"),
            "missing": auth.IdentityClaims(user_id=f"missing-{uuid4()}", role="USER"),
        }
        current = "active"
        monkeypatch.setattr(telemetry, "_verify_token", lambda _token: identities[current])

        monkeypatch.setenv("AALIE_STUDY_TELEMETRY_ENABLED", "false")
        telemetry.record_request_event(
            _request(slug=study.slug),
            event_name="analysis_run",
            success=True,
            duration_ms=10,
            error_code=None,
        )

        monkeypatch.setenv("AALIE_STUDY_TELEMETRY_ENABLED", "true")
        for identity_key in ("null", "withdrawn", "missing"):
            current = identity_key
            telemetry.record_request_event(
                _request(slug=study.slug),
                event_name="analysis_run",
                success=True,
                duration_ms=10,
                error_code=None,
            )

        current = "active"
        telemetry.record_request_event(
            _request(slug=None),
            event_name="analysis_run",
            success=True,
            duration_ms=10,
            error_code=None,
        )
        telemetry.record_request_event(
            _request(slug=study.slug, token=None),
            event_name="analysis_run",
            success=True,
            duration_ms=10,
            error_code=None,
        )
        telemetry.record_request_event(
            _request(slug=study.slug),
            event_name="analysis_run",
            success=True,
            duration_ms=10,
            error_code=None,
        )

        with factory() as db:
            events = list(db.scalars(select(StudyEvent)))
            study_events = [e for e in events if e.participant_id == active.id]
            assert len(study_events) == 1
            assert study_events[0].event_name == "analysis_run"
            assert study_events[0].duration_ms == 10

        monkeypatch.setattr(
            telemetry,
            "_verify_token",
            lambda _token: (_ for _ in ()).throw(RuntimeError("telemetry dependency failed")),
        )
        telemetry.record_request_event(
            _request(slug=study.slug),
            event_name="analysis_run",
            success=True,
            duration_ms=1,
            error_code=None,
        )

        forbidden_columns = {"email", "name", "ip", "user_agent", "source_code", "prompt"}
        assert forbidden_columns.isdisjoint(StudyEvent.__table__.columns.keys())
    finally:
        _cleanup(study_id)


def test_export_manifest_grade_consistency_and_audit_row() -> None:
    factory = get_session_factory()
    study_id = None
    try:
        with factory() as db:
            study = _active_study(db, prefix="export-gate")
            study_id = study.id
            user = f"export-gate-{uuid4()}"
            participant = consent_to_study(db, study=study, user_id=user)
            participant = assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="AALIE",
            )
            add_measurement(
                db,
                participant=participant,
                payload=StudyMeasurementRequest(
                    metricKey="posttest_score",
                    metricVersion="1",
                    phase="post",
                    numericValue=9.0,
                    unit="points",
                ),
            )
            quiz = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=2),
                    locale="es",
                ),
            )
            result = evaluate_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user,
                payload=QuizAnswerSubmission(
                    sessionId=quiz.sessionId,
                    questionIds=[],
                    answers=[_answer(q.questionId, quiz.locale) for q in quiz.questions],
                    locale=quiz.locale,
                ),
            )
            assert result.score == result.maxScore

        export = build_study_export(study_id)
        with zipfile.ZipFile(io.BytesIO(export.archive)) as archive:
            manifest = json.loads(archive.read("manifest.json"))
            attempt_rows = list(
                csv.DictReader(io.StringIO(archive.read("quiz_attempts.csv").decode()))
            )
            item_rows = list(
                csv.DictReader(io.StringIO(archive.read("quiz_items.csv").decode()))
            )
            participants = list(
                csv.DictReader(io.StringIO(archive.read("participants.csv").decode()))
            )
            measurements = list(
                csv.DictReader(io.StringIO(archive.read("measurements.csv").decode()))
            )

            assert manifest["generatedAt"] == manifest["cutoffAt"]
            assert manifest["rowCounts"] == export.row_counts
            assert export.row_counts["participants"] == len(participants)
            assert export.row_counts["quizAttempts"] == len(attempt_rows)
            assert export.row_counts["quizItems"] == len(item_rows)
            assert export.row_counts["measurements"] == len(measurements)
            assert manifest["selectorVersions"] == [QUIZ_SELECTOR_VERSION]
            assert manifest["gradingVersions"] == [QUIZ_GRADING_VERSION]
            assert manifest["progressVersions"] == [QUIZ_PROGRESS_VERSION]

            scores_by_attempt: dict[str, float] = {}
            for row in item_rows:
                scores_by_attempt[row["attempt_id"]] = scores_by_attempt.get(
                    row["attempt_id"], 0.0
                ) + float(row["score"])
            for row in attempt_rows:
                assert round(scores_by_attempt[row["attempt_id"]], 4) == round(
                    float(row["score"]), 4
                )

            for filename, digest in manifest["files"].items():
                assert digest == f"sha256:{hashlib.sha256(archive.read(filename)).hexdigest()}"

        with factory() as db:
            audit = record_export_audit(
                db,
                study_id=study_id,
                admin_user_id="admin-test",
                export=export,
            )
            stored = db.get(StudyExportAudit, audit.id)
            assert stored is not None
            assert stored.archive_sha256 == export.sha256
            assert stored.participant_rows == export.row_counts["participants"]
            assert stored.attempt_rows == export.row_counts["quizAttempts"]
            assert stored.item_rows == export.row_counts["quizItems"]
            assert stored.event_rows == export.row_counts["events"]
            assert stored.measurement_rows == export.row_counts["measurements"]
    finally:
        _cleanup(study_id)


def test_admin_study_routes_are_guarded_and_auth_semantics_are_401_403_200() -> None:
    admin_routes = [
        route
        for route in studies_router.routes
        if isinstance(route, APIRoute) and route.path.startswith("/admin/studies")
    ]
    assert admin_routes
    for route in admin_routes:
        dependency_calls = {dependency.call for dependency in route.dependant.dependencies}
        assert auth.require_admin in dependency_calls

    with pytest.raises(HTTPException) as unauthenticated:
        auth.get_identity(None)
    assert unauthenticated.value.status_code == 401

    with pytest.raises(HTTPException) as user:
        auth.require_admin(auth.IdentityClaims(user_id="user", role="USER"))
    assert user.value.status_code == 403

    admin = auth.require_admin(auth.IdentityClaims(user_id="admin", role="ADMIN"))
    assert admin.role == "ADMIN"
