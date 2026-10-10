from datetime import datetime, timezone
from types import SimpleNamespace

from app.modules.studies.classroom import classroom_roster, is_classroom_student


def test_operators_are_not_classroom_students() -> None:
    assert is_classroom_student("juan.cruz37552@ucaldas.edu.co") is False
    assert is_classroom_student("jacobo.arroyave46095@ucaldas.edu.co") is True
    assert is_classroom_student(None) is False


def test_roster_puts_the_latest_activity_first(monkeypatch) -> None:
    import app.modules.studies.classroom as classroom

    recent = datetime(2026, 10, 9, tzinfo=timezone.utc)
    older = datetime(2026, 10, 1, tzinfo=timezone.utc)
    emails = ["quiet@ucaldas.edu.co", "older@ucaldas.edu.co", "recent@ucaldas.edu.co"]
    activity = {
        "quiet@ucaldas.edu.co": None,
        "older@ucaldas.edu.co": older,
        "recent@ucaldas.edu.co": recent,
    }

    monkeypatch.setattr(classroom, "_student_emails", lambda _db: emails)
    monkeypatch.setattr(classroom, "_user_id", lambda _db, email: email)
    monkeypatch.setattr(
        classroom,
        "get_participant_for_user",
        lambda _db, *, study_id, user_id: SimpleNamespace(id=user_id),
    )
    monkeypatch.setattr(
        classroom,
        "_activity_for_participant",
        lambda _db, participant_id: (
            activity[participant_id],
            {"analysis": 1, "trace": 0, "quizzes": 0, "assistant": 0},
            [],
        ),
    )

    rows = classroom_roster(SimpleNamespace(scalar=lambda _query: SimpleNamespace(id="study")))

    assert [row.email for row in rows] == [
        "recent@ucaldas.edu.co",
        "older@ucaldas.edu.co",
        "quiet@ucaldas.edu.co",
    ]
