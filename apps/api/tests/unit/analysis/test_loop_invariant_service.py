"""Unit tests for deterministic loop invariant orchestration."""

from app.modules.analysis.invariants.service import generate_loop_invariant


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


def _if(line: int, test, consequent_body):
    return {
        "type": "If",
        "test": test,
        "consequent": {
            "type": "Block",
            "body": consequent_body,
            "pos": {"line": line + 1, "column": 2},
        },
        "alternate": None,
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


def _while(line: int, test, body):
    return {
        "type": "While",
        "test": test,
        "body": {"type": "Block", "body": body, "pos": {"line": line + 1, "column": 2}},
        "pos": {"line": line, "column": 0},
    }


def _repeat(line: int, body, test):
    return {
        "type": "Repeat",
        "body": {"type": "Block", "body": body, "pos": {"line": line + 1, "column": 2}},
        "test": test,
        "pos": {"line": line, "column": 0},
    }


def _program(statements):
    return {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "main",
                "params": [],
                "body": {
                    "type": "Block",
                    "body": statements,
                    "pos": {"line": 1, "column": 0},
                },
                "pos": {"line": 1, "column": 0},
            }
        ],
        "pos": {"line": 1, "column": 0},
    }


def test_service_returns_fixed_shape_when_no_supported_loop():
    ast = _program(
        [
            _assign(2, _identifier("x"), _literal(1)),
            _assign(3, _identifier("y"), _literal(2)),
        ]
    )

    result = generate_loop_invariant(ast, locale="es")

    assert result["status"] == "unavailable"
    assert result["reason"] == "no_supported_loop"
    assert "selectedLoop" in result
    assert "invariant" in result
    assert "evidence" in result
    assert set(result["selectedLoop"].keys()) == {
        "nodeType",
        "lineStart",
        "lineEnd",
        "depth",
        "score",
        "patternType",
        "controlVariables",
        "stateVariables",
        "boundVariables",
        "collectionVariables",
        "targetVariables",
        "keyUpdates",
        "keyConditions",
    }


def test_service_detects_repeat_loop_and_keeps_formal_sections():
    repeat_loop = _repeat(
        3,
        body=[
            _if(
                4,
                {
                    "type": "Binary",
                    "op": "==",
                    "left": _index("A", _identifier("i")),
                    "right": _identifier("x"),
                },
                consequent_body=[
                    {
                        "type": "Return",
                        "value": _identifier("i"),
                        "pos": {"line": 5, "column": 4},
                    }
                ],
            ),
            _assign(
                6,
                _identifier("i"),
                {
                    "type": "Binary",
                    "op": "+",
                    "left": _identifier("i"),
                    "right": _literal(1),
                },
            ),
        ],
        test={
            "type": "Binary",
            "op": ">",
            "left": _identifier("i"),
            "right": _identifier("n"),
        },
    )
    ast = _program(
        [
            _assign(2, _identifier("i"), _literal(1)),
            repeat_loop,
        ]
    )

    result = generate_loop_invariant(ast, locale="en")

    assert result["selectedLoop"]["nodeType"] == "REPEAT"
    assert result["invariant"]["propertyStatement"].startswith(
        "At the start of each iteration"
    ) or result["invariant"]["propertyStatement"].startswith("In REPEAT")
    assert result["invariant"]["propertyStatement"]
    assert result["invariant"]["initialization"]
    assert result["invariant"]["maintenance"]
    assert result["invariant"]["finalization"]


def test_service_returns_low_confidence_when_evidence_is_insufficient():
    ast = _program(
        [
            _while(
                2,
                {
                    "type": "Binary",
                    "op": ">",
                    "left": _identifier("n"),
                    "right": _literal(0),
                },
                [_assign(3, _identifier("x"), _literal(1))],
            )
        ]
    )

    result = generate_loop_invariant(ast, locale="es")

    assert result["status"] == "low_confidence"
    assert result["reason"] == "insufficient_evidence"
    assert result["selectedLoop"]["patternType"] == "unknown"
    assert result["evidence"]["classificationConfidence"] <= 0.69


def test_service_is_stable_for_same_input():
    ast = _program(
        [
            _assign(2, _identifier("sum"), _literal(0)),
            _for(
                3,
                "i",
                [
                    _assign(
                        4,
                        _identifier("sum"),
                        {
                            "type": "Binary",
                            "op": "+",
                            "left": _identifier("sum"),
                            "right": _index("A", _identifier("i")),
                        },
                    )
                ],
            ),
        ]
    )

    first = generate_loop_invariant(ast, locale="en")
    second = generate_loop_invariant(ast, locale="en")

    assert first == second


def test_service_includes_template_traceability_feature():
    ast = _program(
        [
            _assign(2, _identifier("sum"), _literal(0)),
            _for(
                3,
                "i",
                [
                    _assign(
                        4,
                        _identifier("sum"),
                        {
                            "type": "Binary",
                            "op": "+",
                            "left": _identifier("sum"),
                            "right": _index("A", _identifier("i")),
                        },
                    )
                ],
            ),
        ]
    )

    result = generate_loop_invariant(ast, locale="es")
    features = result["evidence"]["detectedFeatures"]

    assert any(feature.startswith("template:") for feature in features)
    assert "classificationConfidence" in result["evidence"]
    assert "templateVariant" in result["evidence"]
