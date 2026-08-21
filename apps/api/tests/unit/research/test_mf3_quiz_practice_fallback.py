from __future__ import annotations

import pytest
from fastapi import HTTPException, Request

from app.core.auth import IdentityClaims
from app.modules.quizzes import router as quiz_router
from app.modules.quizzes.schemas import QuizAnswerSubmission, QuizSelectionRequest

pytestmark = [pytest.mark.fast, pytest.mark.unit]


class _DummySession:
    def __enter__(self):
        return self

    def __exit__(self, _exc_type, _exc, _tb) -> None:
        return None


class _Model:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload

    def model_dump(self) -> dict[str, object]:
        return self.payload


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/quizzes/attempts",
            "headers": [(b"x-aalie-study-slug", b"study-v1")],
        }
    )


def _patch_ineligible_context(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(quiz_router, "get_session_factory", lambda: lambda: _DummySession())
    monkeypatch.setattr(
        quiz_router,
        "optional_identity_from_request",
        lambda _request: IdentityClaims(user_id="user-1", role="USER"),
    )
    monkeypatch.setattr(
        quiz_router,
        "_study_recording_is_eligible",
        lambda _db, **_kwargs: False,
    )


def test_ineligible_study_context_falls_back_to_practice_without_study_write(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ineligible_context(monkeypatch)
    monkeypatch.setattr(
        quiz_router,
        "create_study_quiz_session",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("study evidence must not be created")
        ),
    )
    monkeypatch.setattr(
        quiz_router,
        "create_session",
        lambda _payload: _Model({"sessionId": "practice-session"}),
    )

    result = quiz_router.create_quiz_attempt(_request(), QuizSelectionRequest())

    assert result == {"sessionId": "practice-session"}


def test_persisted_study_session_never_degrades_to_practice_on_evaluation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ineligible_context(monkeypatch)
    monkeypatch.setattr(
        quiz_router,
        "_is_persisted_study_session",
        lambda _db, _session_id: True,
    )
    monkeypatch.setattr(
        quiz_router,
        "evaluate_session",
        lambda _payload: (_ for _ in ()).throw(
            AssertionError("persisted evidence must not fall back to practice grading")
        ),
    )

    with pytest.raises(HTTPException) as exc:
        quiz_router.evaluate_quiz_attempt(
            _request(),
            QuizAnswerSubmission(
                sessionId="study-session",
                questionIds=[],
                answers=[],
            ),
        )

    assert exc.value.status_code == 409
