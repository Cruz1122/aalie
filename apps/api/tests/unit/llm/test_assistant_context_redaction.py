"""Redacción de assistantContext antes de enviarlo al LLM."""

from app.modules.llm.service import _redact_assistant_context_for_llm


def test_redact_removes_weak_skill_ids_lists_skill_id_count():
    ctx = {
        "surface": "quizzes",
        "quizDashboard": {
            "areasToImprove": ["Recursion"],
            "strengths": ["Loops"],
            "weakSkillIds": ["skill.foo.bar", "skill.other"],
            "lastFailedTopicIds": ["Big-O"],
            "recentAttempts": [],
        },
    }
    out = _redact_assistant_context_for_llm(ctx)
    qd = out["quizDashboard"]
    assert "weakSkillIds" not in qd
    assert qd["weakSkillIdCount"] == 2
    assert qd["areasToImprove"] == ["Recursion"]


def test_redact_strips_skill_ids_from_session_review_questions():
    ctx = {
        "quizSessionReview": {
            "view": "summary",
            "reviewStepIndex": 0,
            "reviewStepTotal": 1,
            "sessionId": "s1",
            "overallAccuracy": 1.0,
            "overallScore": 1,
            "overallMaxScore": 1,
            "areasToImprove": [],
            "strengths": [],
            "currentQuestion": {
                "index": 0,
                "questionId": "q1",
                "questionType": "single_choice",
                "promptSummary": "x",
                "isCorrect": True,
                "score": 1,
                "maxScore": 1,
                "userAnswerSummary": "a",
                "skillIds": ["skill.a", "skill.b"],
            },
            "allQuestions": [
                {
                    "index": 0,
                    "questionId": "q1",
                    "questionType": "single_choice",
                    "promptSummary": "x",
                    "isCorrect": True,
                    "score": 1,
                    "maxScore": 1,
                    "userAnswerSummary": "a",
                    "skillIds": ["skill.z"],
                },
            ],
        },
    }
    out = _redact_assistant_context_for_llm(ctx)
    r = out["quizSessionReview"]
    assert "skillIds" not in r["currentQuestion"]
    assert "skillIds" not in r["allQuestions"][0]


def test_redact_does_not_mutate_original():
    ctx = {
        "quizDashboard": {
            "areasToImprove": [],
            "strengths": [],
            "weakSkillIds": ["skill.x"],
            "lastFailedTopicIds": [],
            "recentAttempts": [],
        },
    }
    _redact_assistant_context_for_llm(ctx)
    assert ctx["quizDashboard"]["weakSkillIds"] == ["skill.x"]
