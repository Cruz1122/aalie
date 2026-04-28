from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("sympy")

from app.main import create_app

client = TestClient(create_app())


def test_quiz_health_ok():
    res = client.get("/quizzes/health")
    assert res.status_code == 200
    body = res.json()
    assert "datasetId" in body
    assert "activeQuestions" in body


def test_get_taxonomy():
    res = client.get("/quizzes/taxonomy")
    assert res.status_code == 200
    body = res.json()
    assert body["courseId"] == "ada"
    assert isinstance(body["topics"], list)


def test_dataset_summary_counts():
    res = client.get("/quizzes/dataset/summary")
    assert res.status_code == 200
    body = res.json()
    assert "byTopic" in body
    assert "byDifficulty" in body


def test_validate_dataset_ok():
    res = client.post("/quizzes/validate")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True


def test_create_attempt_returns_requested_count():
    payload = {
        "studiedContentRefs": [],
        "masteryBySkill": {},
        "weakSkillIds": [],
        "recentQuestionIds": [],
        "sessionPreferences": {"questionCount": 2, "difficultyMix": {}},
    }
    res = client.post("/quizzes/attempts", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert len(body["questions"]) == 2


def test_create_attempt_with_weak_skill_prioritizes_it():
    payload = {
        "studiedContentRefs": [],
        "masteryBySkill": {},
        "weakSkillIds": ["skill.asymptotic.big_o.upper-bound-interpretation"],
        "recentQuestionIds": [],
        "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
    }
    res = client.post("/quizzes/attempts", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "skill.asymptotic.big_o.upper-bound-interpretation" in body["questions"][0]["skillIds"]


def test_evaluate_attempt_returns_score_and_feedback():
    attempt_payload = {
        "studiedContentRefs": [],
        "masteryBySkill": {},
        "weakSkillIds": [],
        "recentQuestionIds": [],
        "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
    }
    attempt = client.post("/quizzes/attempts", json=attempt_payload).json()
    question = attempt["questions"][0]

    evaluate_payload = {
        "sessionId": attempt["sessionId"],
        "questionIds": [question["questionId"]],
        "answers": [
            {
                "questionId": question["questionId"],
                "selectedOptionIds": [question["options"][0]["optionId"]],
            }
        ],
    }
    res = client.post("/quizzes/attempts/evaluate", json=evaluate_payload)
    assert res.status_code == 200
    body = res.json()
    assert "score" in body
    assert len(body["results"]) == 1


def test_evaluate_rejects_unknown_question_id():
    payload = {
        "sessionId": "x",
        "questionIds": ["missing"],
        "answers": [{"questionId": "missing", "selectedOptionIds": ["a"]}],
    }
    res = client.post("/quizzes/attempts/evaluate", json=payload)
    assert res.status_code == 400


def test_evaluate_rejects_malformed_answer():
    question_id = "ada-recurrence-equations-basic-005"
    payload = {
        "sessionId": "x",
        "questionIds": [question_id],
        "answers": [{"questionId": question_id, "selectedOptionIds": ["a"]}],
    }
    res = client.post("/quizzes/attempts/evaluate", json=payload)
    assert res.status_code == 400
