"""Unit tests for deterministic loop evidence extractor."""

from app.modules.analysis.invariants.extractor import extract_loop_facts


def _identifier(name: str):
    return {"type": "Identifier", "name": name}


def _literal(value):
    return {"type": "Literal", "value": value}


def _binary(op: str, left, right):
    return {"type": "Binary", "op": op, "left": left, "right": right}


def _index(target: str, index_expr):
    return {"type": "Index", "target": _identifier(target), "index": index_expr}


def _assign(line: int, target, value):
    return {
        "type": "Assign",
        "target": target,
        "value": value,
        "pos": {"line": line, "column": 2},
    }


def _if(line: int, test, consequent_body, alternate_body=None):
    return {
        "type": "If",
        "test": test,
        "consequent": {
            "type": "Block",
            "body": consequent_body,
            "pos": {"line": line + 1, "column": 2},
        },
        "alternate": (
            {
                "type": "Block",
                "body": alternate_body,
                "pos": {"line": line + 2, "column": 2},
            }
            if alternate_body
            else None
        ),
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


def test_extractor_detects_multiplicative_accumulator():
    loop = _for(
        3,
        "i",
        [
            _assign(
                4,
                _identifier("prod"),
                _binary("*", _identifier("prod"), _index("A", _identifier("i"))),
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_accumulator_update" in facts.detected_features
    assert "has_multiplicative_accumulator" in facts.detected_features


def test_extractor_detects_copy_like_write():
    loop = _for(
        3,
        "i",
        [
            _assign(
                4,
                _index("B", _identifier("i")),
                _index("A", _identifier("i")),
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_copy_like_update" in facts.detected_features


def test_extractor_detects_search_flag_pattern():
    loop = _for(
        3,
        "i",
        [
            _if(
                4,
                _binary("==", _index("A", _identifier("i")), _identifier("x")),
                [_assign(5, _identifier("found"), _literal(True))],
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_search_flag_update" in facts.detected_features
    assert "has_collection_target_comparison" in facts.detected_features


def test_extractor_detects_binary_search_interval_features():
    loop = _while(
        3,
        _binary("<=", _identifier("low"), _identifier("high")),
        [
            _assign(
                4,
                _identifier("mid"),
                _binary(
                    "/",
                    _binary("+", _identifier("low"), _identifier("high")),
                    _literal(2),
                ),
            ),
            _if(
                5,
                _binary("<", _index("A", _identifier("mid")), _identifier("x")),
                [
                    _assign(
                        6,
                        _identifier("low"),
                        _binary("+", _identifier("mid"), _literal(1)),
                    )
                ],
                [
                    _assign(
                        7,
                        _identifier("high"),
                        _binary("-", _identifier("mid"), _literal(1)),
                    )
                ],
            ),
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_midpoint_update" in facts.detected_features
    assert "has_interval_boundary_update" in facts.detected_features
    assert "has_binary_search_interval" in facts.detected_features


def test_extractor_detects_filter_like_compaction():
    loop = _for(
        3,
        "i",
        [
            _if(
                4,
                _binary(">", _index("A", _identifier("i")), _literal(0)),
                [
                    _assign(
                        5, _index("B", _identifier("k")), _index("A", _identifier("i"))
                    ),
                    _assign(
                        6, _identifier("k"), _binary("+", _identifier("k"), _literal(1))
                    ),
                ],
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_filter_like_compaction" in facts.detected_features


def test_extractor_detects_order_check_without_swaps():
    loop = _for(
        3,
        "i",
        [
            _if(
                4,
                _binary(
                    ">",
                    _index("A", _identifier("i")),
                    _index("A", _binary("+", _identifier("i"), _literal(1))),
                ),
                [_assign(5, _identifier("sorted"), _literal(False))],
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_adjacent_collection_comparison" in facts.detected_features
    assert "has_order_check_no_swap" in facts.detected_features


def test_extractor_detects_collection_equality_comparison():
    loop = _while(
        3,
        _binary("<=", _identifier("i"), _identifier("n")),
        [
            _if(
                4,
                _binary(
                    "=", _index("A", _identifier("i")), _index("B", _identifier("j"))
                ),
                [
                    _assign(
                        5, _index("C", _identifier("k")), _index("A", _identifier("i"))
                    )
                ],
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_collection_equality_comparison" in facts.detected_features


def test_extractor_detects_binary_exponentiation_state_anchors():
    loop = _while(
        3,
        _binary(">", _identifier("e"), _literal(0)),
        [
            _if(
                4,
                _binary(
                    "==", _binary("mod", _identifier("e"), _literal(2)), _literal(1)
                ),
                [
                    _assign(
                        5,
                        _identifier("resultado"),
                        _binary(
                            "mod",
                            _binary("*", _identifier("resultado"), _identifier("b")),
                            _identifier("n"),
                        ),
                    )
                ],
            ),
            _assign(6, _identifier("e"), _binary("/", _identifier("e"), _literal(2))),
            _assign(
                7,
                _identifier("b"),
                _binary(
                    "mod",
                    _binary("*", _identifier("b"), _identifier("b")),
                    _identifier("n"),
                ),
            ),
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_binary_exponentiation_state" in facts.detected_features
    assert facts.exponent_var == "e"
    assert facts.base_var == "b"
    assert facts.result_var == "resultado"
    assert facts.modulus_var == "n"


def test_extractor_detects_structural_extrema_signal_with_unusual_names():
    loop = _for(
        3,
        "ix_4",
        [
            _if(
                4,
                _binary(
                    ">", _index("_rack_77", _identifier("ix_4")), _identifier("z_88")
                ),
                [
                    _assign(
                        5, _identifier("z_88"), _index("_rack_77", _identifier("ix_4"))
                    )
                ],
            )
        ],
    )

    facts = extract_loop_facts(loop, depth=0, order=1)

    assert facts is not None
    assert "has_extrema_max_signal" in facts.detected_features
    assert "extrema_candidate:z_88" in facts.detected_features
