from __future__ import annotations

from uuid import uuid4

import pytest

from app.core.database import get_session_factory
from app.db.models.mf3 import Study
from app.modules.quizzes.schemas import QuizSelectionRequest, QuizSessionPreferences
from app.modules.studies.quiz_service import create_study_quiz_session
from app.modules.studies.schemas import StudyCreateRequest
from app.modules.studies.service import (
    assign_condition,
    consent_to_study,
    create_study,
    update_study_status,
)

pytestmark = [pytest.mark.fast, pytest.mark.unit]


def test_study_ignores_client_adaptive_filters_and_bounds_session_length() -> None:
    factory = get_session_factory()
    study_id = None
    user_id = f"authority-{uuid4()}"
    try:
        with factory() as db:
            study = create_study(
                db,
                StudyCreateRequest(
                    slug=f"quiz-authority-{uuid4().hex[:12]}",
                    title="Study quiz authority",
                    protocolVersion="1",
                    consentVersion="1",
                    consentSha256="d" * 64,
                ),
            )
            study = update_study_status(
                db,
                study=study,
                new_status="ACTIVE",
                telemetry_enabled=False,
            )
            study_id = study.id
            participant = consent_to_study(db, study=study, user_id=user_id)
            assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="AALIE",
            )

            tampered = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    masteryBySkill={"client.fake": 0.0},
                    weakSkillIds=["client.fake"],
                    weakTopics=["client.fake"],
                    recentQuestionIds=["client.fake"],
                    recentResults=[
                        {
                            "questionId": "client.fake",
                            "topic": "client.fake",
                            "difficulty": "advanced",
                            "type": "ordering",
                            "wasCorrect": False,
                        }
                    ],
                    sessionPreferences=QuizSessionPreferences(
                        questionCount=2,
                        difficultyMix={"advanced": 1.0},
                        topicIds=["client.fake"],
                        skillIds=["client.fake"],
                    ),
                    locale="es",
                ),
            )
            baseline = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=2),
                    locale="es",
                ),
            )

            assert [q.questionId for q in tampered.questions] == [
                q.questionId for q in baseline.questions
            ]
            assert tampered.metadata["selectionMode"] == "adaptive_deterministic_server"

            bounded = create_study_quiz_session(
                db,
                study_slug=study.slug,
                user_id=user_id,
                payload=QuizSelectionRequest(
                    sessionPreferences=QuizSessionPreferences(questionCount=10_000),
                    locale="es",
                ),
            )
            assert 1 <= len(bounded.questions) <= 20
    finally:
        if study_id is not None:
            with factory() as db:
                study = db.get(Study, study_id)
                if study is not None:
                    db.delete(study)
                    db.commit()
