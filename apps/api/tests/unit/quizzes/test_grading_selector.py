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
    q = deepcopy(next(q for q in questions.values() if q.type == "multiple_choice"))
    q.gradingPolicy.mode = "exact_set"
    
    # We need an answer that is exactly correct. The first option is usually correct?
    # Actually, we can just use the known correct answer from the question itself.
    correct_options = q.answer.correctOptionIds
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=correct_options))
    assert result.score == 1


def test_grade_multiple_choice_exact_set_wrong_extra_option():
    questions = load_questions()
    q = deepcopy(next(q for q in questions.values() if q.type == "multiple_choice"))
    q.gradingPolicy.mode = "exact_set"
    
    correct_options = q.answer.correctOptionIds
    all_options = [opt.optionId for opt in q.options]
    extra = next(opt for opt in all_options if opt not in correct_options)
    
    result = grade_question(q, StudentAnswer(questionId=q.questionId, selectedOptionIds=correct_options + [extra]))
    assert result.score == 0


def test_grade_ordering_exact_wrong_order():
    questions = load_questions()
    q = deepcopy(next(q for q in questions.values() if q.type == "ordering"))
    
    bad_order = list(reversed(q.answer.orderedOptionIds))
    result = grade_question(
        q,
        StudentAnswer(
            questionId=q.questionId,
            orderedOptionIds=bad_order,
        ),
    )
    assert result.score == 0


def test_grade_match_pairs_pairwise_partial():
    questions = load_questions()
    q = deepcopy(next(q for q in questions.values() if q.type == "match_pairs"))
    q.gradingPolicy.mode = "pairwise"
    
    result = grade_question(
        q,
        StudentAnswer(
            questionId=q.questionId,
            pairs=[{"leftId": q.answer.pairs[0].leftId, "rightId": q.answer.pairs[0].rightId}],
        ),
    )
    assert 0 < result.score <= 1


def test_grade_multiple_choice_partial_credit():
    questions = load_questions()
    q = deepcopy(next(q for q in questions.values() if q.type == "multiple_choice"))
    q.gradingPolicy.mode = "partial_credit"
    q.gradingPolicy.penalty = 0.1
    
    correct_options = q.answer.correctOptionIds
    result = grade_question(
        q,
        StudentAnswer(questionId=q.questionId, selectedOptionIds=[correct_options[0]]),
    )
    assert result.score >= 0
    assert result.score <= q.gradingPolicy.maxScore


def test_grade_rejects_malformed_answer_shape():
    questions = load_questions()
    q = deepcopy(next(q for q in questions.values() if q.type == "match_pairs"))
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
            "sessionPreferences": {"questionCount": 1000, "difficultyMix": {}},
        }
    )
    selected = select_questions(questions, req)
    assert "insufficient_questions" in selected.warnings


def test_selector_filters_by_module_id():
    questions = list(load_questions().values())
    module_id = questions[0].contentRefs[0].moduleId

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "sessionPreferences": {"questionCount": 5, "moduleId": module_id},
        }
    )
    selected = select_questions(questions, req)
    for q in selected.questions:
        assert any(ref.moduleId == module_id for ref in q.contentRefs)


def test_selector_filters_by_module_slug_without_prefix():
    questions = list(load_questions().values())
    module_id = questions[0].contentRefs[0].moduleId
    module_slug = module_id.removeprefix("mod-")

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "sessionPreferences": {"questionCount": 5, "moduleId": module_slug},
        }
    )
    selected = select_questions(questions, req)
    assert selected.questions
    for q in selected.questions:
        assert any(ref.moduleId == module_id for ref in q.contentRefs)


def test_selector_filters_by_topic_ids():
    questions = list(load_questions().values())
    topic = questions[0].topic

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "sessionPreferences": {"questionCount": 5, "topicIds": [topic]},
        }
    )
    selected = select_questions(questions, req)
    for q in selected.questions:
        assert q.topic == topic


def test_selector_filters_by_skill_ids_intersection():
    questions = list(load_questions().values())
    skill_id = questions[0].skillIds[0]

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "sessionPreferences": {"questionCount": 5, "skillIds": [skill_id]},
        }
    )
    selected = select_questions(questions, req)
    for q in selected.questions:
        assert skill_id in q.skillIds


def test_selector_prioritizes_weak_skill_ids_without_explicit_skill_filter():
    questions = list(load_questions().values())
    rare_skill = "skill.formulation.choose-control-structure-for-full-traversal"
    with_skill = [
        q for q in questions if q.status == "active" and rare_skill in q.skillIds
    ]
    assert len(with_skill) >= 2

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "weakSkillIds": [rare_skill],
            "sessionPreferences": {"questionCount": 2},
        }
    )
    selected = select_questions(questions, req)
    assert len(selected.questions) == 2
    for q in selected.questions:
        assert rare_skill in q.skillIds


def test_selector_prioritizes_skills_from_low_mastery():
    questions = list(load_questions().values())
    rare_skill = "skill.formulation.choose-control-structure-for-full-traversal"
    with_skill = [
        q for q in questions if q.status == "active" and rare_skill in q.skillIds
    ]
    assert len(with_skill) >= 2

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "masteryBySkill": {rare_skill: 0.2},
            "weakSkillIds": [],
            "sessionPreferences": {"questionCount": 2},
        }
    )
    selected = select_questions(questions, req)
    assert len(selected.questions) == 2
    for q in selected.questions:
        assert rare_skill in q.skillIds


def test_selector_explicit_filters_take_priority_over_weak():
    questions = list(load_questions().values())
    topic1 = questions[0].topic
    topic2 = next(q.topic for q in questions if q.topic != topic1)

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "weakTopics": [topic2],
            "sessionPreferences": {"questionCount": 5, "topicIds": [topic1]},
        }
    )
    selected = select_questions(questions, req)
    for q in selected.questions:
        assert q.topic == topic1


def test_selector_warns_when_explicit_filters_yield_empty():
    questions = list(load_questions().values())

    from app.modules.quizzes.schemas import QuizSelectionRequest

    req = QuizSelectionRequest.model_validate(
        {
            "studiedContentRefs": [],
            "sessionPreferences": {"questionCount": 5, "moduleId": "non_existent_module_id_123"},
        }
    )
    selected = select_questions(questions, req)
    assert len(selected.questions) == 0
    assert "explicit_filters_no_match" in selected.warnings
