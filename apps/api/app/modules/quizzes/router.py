from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException

from .repository import get_validated_dataset
from .schemas import QuizAnswerSubmission, QuizSelectionRequest
from .service import create_session, evaluate_session, get_dataset_summary, get_health
from .taxonomy import load_taxonomy

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


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
def create_quiz_attempt(payload: QuizSelectionRequest = Body(...)) -> dict[str, object]:
    try:
        return create_session(payload).model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/attempts/evaluate")
def evaluate_quiz_attempt(payload: QuizAnswerSubmission = Body(...)) -> dict[str, object]:
    try:
        return evaluate_session(payload).model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# Backward-compatible aliases for previous MVP paths
@router.post("/session")
def create_quiz_session_alias(payload: QuizSelectionRequest = Body(...)) -> dict[str, object]:
    return create_quiz_attempt(payload)


@router.post("/evaluate")
def evaluate_quiz_alias(payload: QuizAnswerSubmission = Body(...)) -> dict[str, object]:
    return evaluate_quiz_attempt(payload)
