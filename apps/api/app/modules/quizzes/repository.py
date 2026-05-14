from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from .schemas import QuizDataset, QuizQuestion, ValidationReport
from .validator import validate_dataset

_env_quiz_dir = os.getenv("QUIZ_DATA_DIR", "").strip()
if _env_quiz_dir:
    QUIZ_DIR = Path(_env_quiz_dir)
else:
    REPO_ROOT = Path(__file__).resolve().parents[5]
    QUIZ_DIR = REPO_ROOT / "packages" / "content-data" / "quizzes"
QUIZ_DATA_PATH_ES = QUIZ_DIR / "ada-quiz-bank.json"
QUIZ_DATA_PATH_EN = QUIZ_DIR / "ada-quiz-bank.en.json"


def normalize_quiz_locale(locale: str | None) -> str:
    """Reduce a clave de caché: en vs es (resto cae a banco ES)."""
    if not locale:
        return "es"
    loc = str(locale).strip().lower()
    if loc.startswith("en"):
        return "en"
    return "es"


def _quiz_file_for_locale(locale_key: str) -> Path:
    if locale_key == "en" and QUIZ_DATA_PATH_EN.exists():
        return QUIZ_DATA_PATH_EN
    return QUIZ_DATA_PATH_ES


@lru_cache(maxsize=4)
def load_dataset(locale_key: str) -> tuple[QuizDataset, ValidationReport]:
    path = _quiz_file_for_locale(locale_key)
    data = json.loads(path.read_text(encoding="utf-8"))
    dataset = QuizDataset.model_validate(data)
    report = validate_dataset(dataset)
    return dataset, report


def refresh_dataset_cache() -> None:
    load_dataset.cache_clear()


def get_validated_dataset(locale: str | None = None) -> tuple[QuizDataset, ValidationReport]:
    return load_dataset(normalize_quiz_locale(locale))


def list_questions(locale: str | None = None) -> list[QuizQuestion]:
    dataset, _ = get_validated_dataset(locale)
    return dataset.questions


def get_question(question_id: str, locale: str | None = None) -> QuizQuestion | None:
    dataset, _ = get_validated_dataset(locale)
    for question in dataset.questions:
        if question.questionId == question_id:
            return question
    return None


def get_active_questions(locale: str | None = None) -> list[QuizQuestion]:
    return [question for question in list_questions(locale) if question.status == "active"]
