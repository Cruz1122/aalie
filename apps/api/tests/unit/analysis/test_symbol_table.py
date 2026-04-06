"""
Tests unitarios para semantics.symbol_table y scope_resolver.

Author: @Cruz1122
Version: 0.1.0
"""

import pytest

from app.modules.analysis.semantics import SymbolInfo, SymbolTable, resolve_scope

pytestmark = [pytest.mark.unit, pytest.mark.fast]


class TestSymbolInfo:
    def test_control_candidate(self):
        info = SymbolInfo(
            name="i", participates_in_guard=True, assigned_at=[{"line": 1}]
        )
        assert info.is_control_candidate is True

    def test_bound_candidate(self):
        info = SymbolInfo(name="n", participates_in_guard=True, assigned_at=[])
        assert info.is_bound_candidate is True


class TestSymbolTable:
    def test_get_or_create(self):
        table = SymbolTable("proc")
        s = table.get_or_create("x")
        assert s.name == "x"
        assert table.get("x") is s

    def test_control_candidates(self):
        table = SymbolTable()
        a = table.get_or_create("i")
        a.participates_in_guard = True
        a.assigned_at = [{"line": 1}]
        b = table.get_or_create("n")
        b.participates_in_guard = True
        assert len(table.control_candidates()) == 1
        assert table.control_candidates()[0].name == "i"


class TestScopeResolver:
    def test_resolve_simple_proc(self):
        proc = {
            "name": "foo",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Assign",
                        "pos": {"line": 2},
                        "target": {"type": "identifier", "name": "i"},
                        "value": {"type": "number", "value": 0},
                    },
                    {
                        "type": "While",
                        "pos": {"line": 3},
                        "test": {
                            "type": "binary",
                            "left": {"type": "identifier", "name": "i"},
                            "op": "<",
                            "right": {"type": "identifier", "name": "n"},
                        },
                        "body": {"type": "Block", "body": []},
                    },
                ],
            },
        }
        table = resolve_scope(proc)
        assert table.get("n") is not None
        assert table.get("i") is not None
        assert table.get("i").origin == "local"
        assert len(table.get("i").assigned_at) >= 1
