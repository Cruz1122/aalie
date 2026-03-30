import pytest

from app.modules.analysis.ir.ast_normalizer import normalize_expr, normalize_node
from app.modules.analysis.ir.node_identity import NodeIdentity, node_id
pytestmark = [pytest.mark.unit, pytest.mark.fast]


def test_normalize_expr_binary_unary_and_index():
    expr = {
        "type": "binary",
        "operator": "+",
        "left": {"type": "unary", "op": "-", "arg": {"type": "number", "value": 1}},
        "right": {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "number", "value": 0},
        },
    }

    out = normalize_expr(expr)

    assert out["op"] == "+"
    assert out["operator"] == "+"
    assert out["left"]["op"] == "-"
    assert out["left"]["operator"] == "-"
    assert out["right"]["type"] == "index"


def test_normalize_expr_passthrough_primitives_and_unknown():
    assert normalize_expr(None) is None
    assert normalize_expr("x") == "x"
    assert normalize_expr(1) == 1
    assert normalize_expr(2.5) == 2.5
    assert normalize_expr(True) is True
    assert normalize_expr({"type": "custom", "x": 1}) == {"type": "custom", "x": 1}


def test_normalize_node_covers_structures():
    ast = {
        "type": "Block",
        "body": [
            {
                "type": "Assign",
                "target": {"type": "identifier", "name": "i"},
                "value": {"type": "number", "value": 0},
            },
            {
                "type": "While",
                "test": {
                    "type": "binary",
                    "left": {"type": "identifier", "name": "i"},
                    "operator": "<",
                    "right": {"type": "identifier", "name": "n"},
                },
                "body": {"type": "Block", "body": []},
            },
            {
                "type": "If",
                "test": {
                    "type": "binary",
                    "left": {"type": "identifier", "name": "i"},
                    "operator": "=",
                    "right": {"type": "number", "value": 0},
                },
                "consequent": {"type": "Block", "body": []},
                "alternate": {"type": "Block", "body": []},
            },
            {
                "type": "For",
                "variable": {"type": "identifier", "name": "j"},
                "start": {"type": "number", "value": 1},
                "end": {"type": "identifier", "name": "n"},
                "body": {"type": "Block", "body": []},
            },
            {
                "type": "Repeat",
                "test": {
                    "type": "binary",
                    "left": {"type": "number", "value": 1},
                    "op": "<",
                    "right": {"type": "number", "value": 2},
                },
                "body": {"type": "Block", "body": []},
            },
        ],
    }

    out = normalize_node(ast)

    assert out["type"] == "Block"
    assert out["body"][1]["test"]["op"] == "<"
    assert out["body"][2]["test"]["operator"] == "="
    assert out["body"][3]["start"]["value"] == 1
    assert out["body"][4]["test"]["operator"] == "<"


def test_node_identity_from_pos_and_fallbacks():
    with_pos = {"pos": {"line": 10, "column": 3}}
    nid = node_id(with_pos, path="root.body[0]")
    assert isinstance(nid, NodeIdentity)
    assert nid.line == 10
    assert nid.column == 3
    assert str(nid) == "root.body[0]:10:3"

    with_line_column = {"line": 7, "column": 2}
    nid2 = node_id(with_line_column)
    assert nid2.line == 7
    assert nid2.column == 2

    assert node_id("not-a-node").line == 0
