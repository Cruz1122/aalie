from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core import database
from app.core.config import get_database_url


def test_database_url_is_required(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL is required"):
        get_database_url()


def test_engine_is_created_lazily_and_cached(monkeypatch: pytest.MonkeyPatch):
    calls: list[str] = []
    fake_engine = object()

    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@db/test")
    monkeypatch.setattr(
        database,
        "create_engine",
        lambda url, **kwargs: calls.append(url) or fake_engine,
    )
    database.get_engine.cache_clear()

    assert database.get_engine() is fake_engine
    assert database.get_engine() is fake_engine
    assert calls == ["postgresql+psycopg://user:pass@db/test"]

    database.get_engine.cache_clear()


def test_get_db_closes_session(monkeypatch: pytest.MonkeyPatch):
    session = SimpleNamespace(closed=False)

    def close() -> None:
        session.closed = True

    session.close = close
    monkeypatch.setattr(database, "get_session_factory", lambda: lambda: session)

    dependency = database.get_db()
    assert next(dependency) is session

    with pytest.raises(StopIteration):
        next(dependency)
    assert session.closed is True


def test_connection_check_returns_false_for_runtime_failure(monkeypatch: pytest.MonkeyPatch):
    class BrokenEngine:
        def connect(self):
            raise RuntimeError("database unavailable")

    monkeypatch.setattr(database, "get_engine", lambda: BrokenEngine())
    assert database.check_database_connection() is False


def test_connection_check_executes_select_one(monkeypatch: pytest.MonkeyPatch):
    executed: list[str] = []

    class Connection:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, statement):
            executed.append(str(statement))

    class Engine:
        def connect(self):
            return Connection()

    monkeypatch.setattr(database, "get_engine", lambda: Engine())
    assert database.check_database_connection() is True
    assert executed == ["SELECT 1"]
