from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

import pytest

from app.modules.quizzes.grading import GradingError, grade_question
from app.modules.quizzes.schemas import QuizDataset, StudentAnswer
from app.modules.quizzes.selector import select_questions

DATASET_PATH = (
    Path(__file__).resolve().parents[5]
    / "packages"
    / "content-data"
    / "quizzes"
    / "ada-quiz-bank.json"
)


def load_questions():
    dataset = QuizDataset.model_validate(
        json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    )
    return {q.questionId: q for q in dataset.questions}


def pick_question(
    questions, *, qtype: str, topic: str | None = None, grading_mode: str | None = None
):
    for question in questions.values():
        if question.type != qtype:
            continue
        if topic is not None and question.topic != topic:
            continue
        if grading_mode is not None and question.gradingPolicy.mode != grading_mode:
            continue
        return question
    raise AssertionError(
        f"No question found for type={qtype} topic={topic} grading_mode={grading_mode}"
    )


def test_grade_single_choice_correct():
    questions = load_questions()
    q = pick_question(questions, qtype="single_choice", topic="asymptotic_notation")
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=["a"]))
    assert result.isCorrect is True
    assert result.score == 1


def test_grade_single_choice_wrong():
    questions = load_questions()
    q = pick_question(questions, qtype="single_choice", topic="asymptotic_notation")
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=["b"]))
    assert result.isCorrect is False
    assert result.score == 0


def test_grade_multiple_choice_exact_set_correct():
    questions = load_questions()
    q = pick_question(
        questions,
        qtype="multiple_choice",
        topic="asymptotic_notation",
        grading_mode="exact_set",
    )
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=["a", "b"]))
    assert result.score == 1


def test_grade_multiple_choice_exact_set_wrong_extra_option():
    questions = load_questions()
    q = pick_question(
        questions,
        qtype="multiple_choice",
        topic="asymptotic_notation",
        grading_mode="exact_set",
    )
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=["a", "b", "c"]))
    assert result.score == 0


def test_grade_ordering_exact_wrong_order():
    questions = load_questions()
    q = pick_question(questions, qtype="ordering", topic="loop_invariant")
    result = grade_question(
        q,
        StudentAnswer(
            questionId=q.questionId,
            orderedOptionIds=["step-2", "step-1", "step-3"],
        ),
    )
    assert result.score == 0


def test_grade_match_pairs_pairwise_partial():
    questions = load_questions()
    q = pick_question(questions, qtype="match_pairs", topic="recurrence_equations")
    result = grade_question(
        q,
        StudentAnswer(
            questionId=q.questionId,
            pairs=[{"leftId": "left-1", "rightId": "right-1"}],
        ),
    )
    assert 0 < result.score < 1


def test_grade_multiple_choice_partial_credit():
    questions = load_questions()
    q = deepcopy(pick_question(questions, qtype="multiple_choice", topic="asymptotic_notation"))
    q.gradingPolicy.mode = "partial_credit"
    q.gradingPolicy.penalty = 0.1
    result = grade_question(
        q,
        StudentAnswer(questionId=q.questionId, selectedOptionIds=["a", "c"]),
    )
    assert result.score >= 0
    assert result.score < q.gradingPolicy.maxScore


def test_grade_rejects_malformed_answer_shape():
    questions = load_questions()
    q = pick_question(questions, qtype="match_pairs", topic="recurrence_equations")
    with pytest.raises(GradingError):
        grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=["a"]))


def test_selector_is_deterministic():
    questions = list(load_questions().values())
    payload = {
        "studiedContentRefs": [],
        "masteryBySkill": {},
        "weakSkillIds": [],
        "weakTopics": [],
        "recentResults": [],
        "recentQuestionIds": [],
        "sessionPreferences": {"questionCount": 3, "difficultyMix": {}},
    }

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(payload)
    first = select_questions(questions, req)
    second = select_questions(questions, req)
    assert [q.questionId for q in first.questions] == [q.questionId for q in second.questions]


def test_selector_uses_only_active_questions():
    questions = list(load_questions().values())
    questions[0].status = "draft"

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [],
            "recentQuestionIds": [],
            "sessionPreferences": {"questionCount": 5, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert all(q.status == "active" for q in selected.questions)


def test_selector_excludes_recent_questions():
    questions = list(load_questions().values())
    recent = [questions[0].questionId]

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [],
            "recentQuestionIds": recent,
            "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert selected.questions[0].questionId != recent[0]


def test_selector_prioritizes_failed_topic():
    questions = list(load_questions().values())
    failed_topic = questions[0].topic

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [
                {
                    "questionId": "x",
                    "topic": failed_topic,
                    "difficulty": "basic",
                    "type": "single_choice",
                    "wasCorrect": False,
                }
            ],
            "recentQuestionIds": [],
            "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert selected.questions[0].topic == failed_topic


def test_selector_increases_difficulty_after_good_streak():
    questions = list(load_questions().values())

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [
                {
                    "questionId": "a",
                    "topic": questions[0].topic,
                    "difficulty": "basic",
                    "type": "single_choice",
                    "wasCorrect": True,
                },
                {
                    "questionId": "b",
                    "topic": questions[1].topic,
                    "difficulty": "basic",
                    "type": "single_choice",
                    "wasCorrect": True,
                },
                {
                    "questionId": "c",
                    "topic": questions[2].topic,
                    "difficulty": "basic",
                    "type": "single_choice",
                    "wasCorrect": True,
                },
            ],
            "recentQuestionIds": [
                questions[0].questionId,
                questions[-1].questionId,
            ],
            "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req, include_trace=True)
    assert selected.questions[0].difficulty in {"intermediate", "advanced"}
    assert selected.selectionTrace[0].selectionReason is not None


def test_selector_filters_by_studied_content():
    questions = list(load_questions().values())
    only_ref = questions[0].contentRefs[0].model_dump()

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [only_ref],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [],
            "recentQuestionIds": [],
            "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert any(
        ref.moduleId == only_ref["moduleId"] and ref.chapterId == only_ref["chapterId"]
        for ref in selected.questions[0].contentRefs
    )


def test_selector_degrades_cooldown_when_needed():
    questions = list(load_questions().values())
    from app.modules.quizzes.schemas import QuizSelectionRequest

    target = questions[0]
    same_chapter_ids = [
        question.questionId
        for question in questions
        if question.contentRefs[0].chapterId == target.contentRefs[0].chapterId
    ]
    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [target.contentRefs[0].model_dump()],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [],
            "recentQuestionIds": same_chapter_ids,
            "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert selected.questions


def test_selector_returns_warning_when_insufficient_questions():
    questions = list(load_questions().values())
    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {},
            "weakSkillIds": [],
            "weakTopics": [],
            "recentResults": [],
            "recentQuestionIds": [],
            "sessionPreferences": {"questionCount": 100, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert "insufficient_questions" in selected.warnings
