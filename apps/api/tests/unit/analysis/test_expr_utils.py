"""
Tests unitarios para ir.expr_utils.

Author: @Cruz1122
Version: 0.1.0
"""

import pytest

from app.modules.analysis.ir.expr_utils import (
    expr_equals,
    expr_to_str,
    expr_vars,
    is_literal_false,
    is_literal_true,
    is_simple_constant,
)

pytestmark = [pytest.mark.unit, pytest.mark.fast]



class TestExprToStr:
    def test_none(self):
        assert expr_to_str(None) == ""

    def test_identifier(self):
        assert expr_to_str({"type": "identifier", "name": "x"}) == "x"

    def test_number(self):
        assert expr_to_str({"type": "number", "value": 42}) == "42"

    def test_literal(self):
        assert expr_to_str({"type": "literal", "value": "0"}) == "0"

    def test_binary_with_op(self):
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "op": "+",
            "right": {"type": "number", "value": 1},
        }
        assert "a" in expr_to_str(expr)
        assert "1" in expr_to_str(expr)
        assert "+" in expr_to_str(expr)

    def test_binary_with_operator_fallback(self):
        """Parser puede producir operator en lugar de op."""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "i"},
            "operator": "<",
            "right": {"type": "identifier", "name": "n"},
        }
        result = expr_to_str(expr)
        assert "i" in result
        assert "n" in result
        assert "<" in result

    def test_index(self):
        expr = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"},
        }
        assert expr_to_str(expr) == "A[i]"

    def test_unary(self):
        expr = {
            "type": "unary",
            "operator": "not",
            "arg": {"type": "identifier", "name": "flag"},
        }
        assert "not" in expr_to_str(expr)
        assert "flag" in expr_to_str(expr)


class TestExprVars:
    def test_identifier(self):
        assert expr_vars({"type": "identifier", "name": "x"}) == {"x"}

    def test_binary(self):
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "i"},
            "op": "<",
            "right": {"type": "identifier", "name": "n"},
        }
        assert expr_vars(expr) == {"i", "n"}


class TestIsLiteralTrueFalse:
    def test_literal_true_bool(self):
        assert is_literal_true({"type": "literal", "value": True}) is True

    def test_literal_false_bool(self):
        assert is_literal_false({"type": "literal", "value": False}) is True

    def test_identifier_verdadero(self):
        assert is_literal_true({"type": "identifier", "name": "VERDADERO"}) is True

    def test_identifier_falso(self):
        assert is_literal_false({"type": "identifier", "name": "falso"}) is True


class TestIsSimpleConstant:
    def test_integer(self):
        assert is_simple_constant("42") is True

    def test_float(self):
        assert is_simple_constant("3.14") is True

    def test_negative(self):
        assert is_simple_constant("-1") is True

    def test_variable(self):
        assert is_simple_constant("n") is False

    def test_expression(self):
        assert is_simple_constant("n + 1") is False


class TestExprEquals:
    def test_same_identifier(self):
        a = {"type": "identifier", "name": "x"}
        b = {"type": "identifier", "name": "x"}
        assert expr_equals(a, b) is True

    def test_different_identifier(self):
        a = {"type": "identifier", "name": "x"}
        b = {"type": "identifier", "name": "y"}
        assert expr_equals(a, b) is False
