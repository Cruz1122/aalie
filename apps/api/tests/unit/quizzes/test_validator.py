from __future__ import annotations

import copy
import json
from pathlib import Path

from app.modules.quizzes.schemas import QuizDataset
from app.modules.quizzes.validator import validate_dataset

DATASET_PATH = (
    Path(__file__).resolve().parents[5]
    / "packages"
    / "content-data"
    / "quizzes"
    / "ada-quiz-bank.json"
)


def load_dataset_dict() -> dict:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def build_dataset(mutate=None) -> QuizDataset:
    data = load_dataset_dict()
    if mutate:
        mutate(data)
    return QuizDataset.model_validate(data)


def has_error(report, text: str) -> bool:
    return any(text in item.reason for item in report.errors)

def find_question_index(data: dict, qtype: str) -> int:
    for idx, question in enumerate(data["questions"]):
        if question["type"] == qtype:
            return idx
    raise AssertionError(f"No question with type={qtype}")


def test_valid_sample_dataset_passes():
    report = validate_dataset(build_dataset())
    assert report.errors == []


def test_duplicate_question_id_fails():
    def mutate(data):
        dup = copy.deepcopy(data["questions"][0])
        data["questions"].append(dup)

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "questionId duplicado")


def test_active_question_without_content_refs_fails():
    def mutate(data):
        data["questions"][0]["contentRefs"] = []

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "No puede estar vacio")


def test_broken_content_ref_fails():
    def mutate(data):
        data["questions"][0]["contentRefs"][0]["chapterId"] = "missing-chapter"

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "no resoluble")


def test_invalid_topic_fails():
    def mutate(data):
        data["questions"][0]["topic"] = "unknown_topic"

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "Topic invalido")


def test_invalid_tag_fails():
    def mutate(data):
        data["questions"][0]["tags"] = ["unknown_tag"]

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "Tag invalido")


def test_invalid_skill_id_fails():
    def mutate(data):
        data["questions"][0]["skillIds"] = ["skill.invalid.example"]

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "Skill invalida")


def test_single_choice_with_two_correct_answers_fails():
    def mutate(data):
        data["questions"][0]["answer"]["correctOptionIds"] = ["a", "b"]

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "exactamente una respuesta correcta")


def test_multiple_choice_without_correct_answer_fails():
    def mutate(data):
        data["questions"][1]["answer"]["correctOptionIds"] = []

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "al menos una respuesta correcta")


def test_ordering_missing_item_fails():
    def mutate(data):
        idx = find_question_index(data, "ordering")
        ordered = data["questions"][idx]["answer"]["orderedOptionIds"]
        data["questions"][idx]["answer"]["orderedOptionIds"] = ordered[:-1]

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "debe incluir todos")


def test_match_pair_unknown_right_id_fails():
    def mutate(data):
        idx = find_question_index(data, "match_pairs")
        data["questions"][idx]["answer"]["pairs"][0]["rightId"] = "missing-right"

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "IDs inexistentes")


def test_option_without_feedback_fails():
    def mutate(data):
        data["questions"][0]["options"][0]["feedback"]["blocks"] = []

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "requiere feedback")


def test_incompatible_grading_policy_fails():
    def mutate(data):
        data["questions"][0]["gradingPolicy"]["mode"] = "pairwise"

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "incompatible")


def test_dataset_above_500_fails():
    def mutate(data):
        seed = copy.deepcopy(data["questions"][0])
        while len(data["questions"]) <= 500:
            clone = copy.deepcopy(seed)
            clone["questionId"] = f"bulk-test-{len(data['questions']) + 1:03d}"
            data["questions"].append(clone)

    report = validate_dataset(build_dataset(mutate))
    assert has_error(report, "excede alcance")
