from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .schemas import QuizDataset, QuizQuestion, ValidationReport
from .validator import validate_dataset

REPO_ROOT = Path(__file__).resolve().parents[5]
QUIZ_DATA_PATH = REPO_ROOT / "packages" / "content-data" / "quizzes" / "ada-quiz-bank.json"


@lru_cache(maxsize=1)
def load_dataset() -> tuple[QuizDataset, ValidationReport]:
    data = json.loads(QUIZ_DATA_PATH.read_text(encoding="utf-8"))
    dataset = QuizDataset.model_validate(data)
    report = validate_dataset(dataset)
    return dataset, report


def refresh_dataset_cache() -> None:
    load_dataset.cache_clear()


def get_validated_dataset() -> tuple[QuizDataset, ValidationReport]:
    return load_dataset()


def list_questions() -> list[QuizQuestion]:
    dataset, _ = get_validated_dataset()
    return dataset.questions


def get_question(question_id: str) -> QuizQuestion | None:
    dataset, _ = get_validated_dataset()
    for question in dataset.questions:
        if question.questionId == question_id:
            return question
    return None


def get_active_questions() -> list[QuizQuestion]:
    return [question for question in list_questions() if question.status == "active"]
