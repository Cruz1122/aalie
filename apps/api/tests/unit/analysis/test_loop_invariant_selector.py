"""Unit tests for deterministic loop selector."""

import pytest

from app.modules.analysis.invariants.selector import select_significant_loop

pytestmark = [pytest.mark.unit, pytest.mark.fast]


def _identifier(name: str):
    return {"type": "Identifier", "name": name}


def _literal(value):
    return {"type": "Literal", "value": value}


def _index(target: str, index_expr):
    return {"type": "Index", "target": _identifier(target), "index": index_expr}


def _assign(line: int, target, value):
    return {
        "type": "Assign",
        "target": target,
        "value": value,
        "pos": {"line": line, "column": 2},
    }


def _for(line: int, var: str, body):
    return {
        "type": "For",
        "var": var,
        "start": _literal(1),
        "end": _identifier("n"),
        "body": {"type": "Block", "body": body, "pos": {"line": line + 1, "column": 2}},
        "pos": {"line": line, "column": 0},
    }


def test_selector_prefers_non_trivial_loop_over_trivial_loop():
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "demo",
                "params": [],
                "body": {
                    "type": "Block",
                    "body": [
                        _for(2, "i", [_assign(3, _identifier("x"), _literal(1))]),
                        _for(
                            6,
                            "j",
                            [
                                _assign(7, _identifier("sum"), _literal(0)),
                                _assign(
                                    8,
                                    _identifier("sum"),
                                    {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": _identifier("sum"),
                                        "right": _index("A", _identifier("j")),
                                    },
                                ),
                            ],
                        ),
                    ],
                    "pos": {"line": 1, "column": 0},
                },
                "pos": {"line": 1, "column": 0},
            }
        ],
        "pos": {"line": 1, "column": 0},
    }

    selection = select_significant_loop(ast)

    assert selection.selected is not None
    assert selection.selected.line_start == 6
    assert selection.selected.order == 2
    assert selection.selected.score >= selection.ranked[1].score


def test_selector_tie_break_prefers_lower_depth(monkeypatch):
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "depthTie",
                "params": [],
                "body": {
                    "type": "Block",
                    "body": [
                        _for(
                            2,
                            "i",
                            [
                                _for(
                                    4, "j", [_assign(5, _identifier("x"), _literal(1))]
                                ),
                            ],
                        ),
                    ],
                },
            }
        ],
    }

    monkeypatch.setattr(
        "app.modules.analysis.invariants.selector._score_loop",
        lambda _facts: {"score": 10.0},
    )

    selection = select_significant_loop(ast)

    assert selection.selected is not None
    assert selection.selected.depth == 0
    assert selection.selected.line_start == 2


def test_selector_tie_break_prefers_earlier_appearance(monkeypatch):
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "orderTie",
                "params": [],
                "body": {
                    "type": "Block",
                    "body": [
                        _for(2, "i", [_assign(3, _identifier("a"), _literal(1))]),
                        _for(6, "j", [_assign(7, _identifier("b"), _literal(1))]),
                    ],
                },
            }
        ],
    }

    monkeypatch.setattr(
        "app.modules.analysis.invariants.selector._score_loop",
        lambda _facts: {"score": 12.0},
    )

    selection = select_significant_loop(ast)

    assert selection.selected is not None
    assert selection.selected.depth == 0
    assert selection.selected.line_start == 2
    assert selection.selected.order == 1
