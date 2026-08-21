from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.database import get_session_factory
from ...db.models.mf3 import StudyQuizAttempt
from ..studies.identity import optional_identity_from_request
from ..studies.quiz_service import create_study_quiz_session, evaluate_study_quiz_session
from ..studies.service import require_recording_participant
from .repository import get_validated_dataset
from .schemas import QuizAnswerSubmission, QuizSelectionRequest
from .service import create_session, evaluate_session, get_dataset_summary, get_health
from .taxonomy import load_taxonomy

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _study_slug(request: Request) -> str | None:
    value = request.headers.get("x-aalie-study-slug", "").strip()
    return value or None


def _study_recording_is_eligible(db: Session, *, slug: str, user_id: str) -> bool:
    try:
        require_recording_participant(db, study_slug=slug, user_id=user_id)
        return True
    except HTTPException as exc:
        if exc.status_code in {403, 404, 409}:
            return False
        raise


def _is_persisted_study_session(db: Session, session_id: str) -> bool:
    return (
        db.scalar(
            select(StudyQuizAttempt.id).where(StudyQuizAttempt.session_id == session_id)
        )
        is not None
    )


@router.get("/health")
def quizzes_health() -> dict[str, object]:
    return get_health()


@router.get("/taxonomy")
def get_taxonomy() -> dict[str, object]:
    return load_taxonomy().model_dump()


@router.get("/dataset/summary")
def dataset_summary() -> dict[str, dict[str, int]]:
    return get_dataset_summary()


@router.post("/validate")
def validate_dataset() -> dict[str, object]:
    _, report = get_validated_dataset()
    return {
        "ok": len(report.errors) == 0,
        "errors": [item.model_dump() for item in report.errors],
        "warnings": [item.model_dump() for item in report.warnings],
    }


@router.post("/attempts")
def create_quiz_attempt(
    request: Request,
    payload: QuizSelectionRequest = Body(...),
) -> dict[str, object]:
    try:
        slug = _study_slug(request)
        if slug:
            identity = optional_identity_from_request(request)
            if identity is None:
                raise HTTPException(status_code=401, detail="Study quiz requires authentication")
            with get_session_factory()() as db:
                if _study_recording_is_eligible(
                    db,
                    slug=slug,
                    user_id=identity.user_id,
                ):
                    return create_study_quiz_session(
                        db,
                        study_slug=slug,
                        user_id=identity.user_id,
                        payload=payload,
                    ).model_dump()
                # A stale/inactive/unassigned study context must never block the
                # normal pedagogical quiz. No study row is written in this path.
                return create_session(payload).model_dump()
        return create_session(payload).model_dump()
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/attempts/evaluate")
def evaluate_quiz_attempt(
    request: Request,
    payload: QuizAnswerSubmission = Body(...),
) -> dict[str, object]:
    try:
        slug = _study_slug(request)
        if slug:
            identity = optional_identity_from_request(request)
            if identity is None:
                raise HTTPException(status_code=401, detail="Study quiz requires authentication")
            with get_session_factory()() as db:
                if _study_recording_is_eligible(
                    db,
                    slug=slug,
                    user_id=identity.user_id,
                ):
                    return evaluate_study_quiz_session(
                        db,
                        study_slug=slug,
                        user_id=identity.user_id,
                        payload=payload,
                    ).model_dump()
                if _is_persisted_study_session(db, payload.sessionId):
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            "Study quiz evidence cannot be submitted while study "
                            "participation is inactive; start a new practice quiz"
                        ),
                    )
                # Practice sessions created while the study context is not
                # eligible remain usable, but are never persisted as evidence.
                return evaluate_session(payload).model_dump()
        return evaluate_session(payload).model_dump()
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/session")
def create_quiz_session_alias(
    request: Request,
    payload: QuizSelectionRequest = Body(...),
) -> dict[str, object]:
    return create_quiz_attempt(request=request, payload=payload)


@router.post("/evaluate")
def evaluate_quiz_alias(
    request: Request,
    payload: QuizAnswerSubmission = Body(...),
) -> dict[str, object]:
    return evaluate_quiz_attempt(request=request, payload=payload)
