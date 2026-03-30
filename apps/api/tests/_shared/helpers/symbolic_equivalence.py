from __future__ import annotations

from sympy import simplify, sympify


def assert_symbolic_equivalence(expr_a: str, expr_b: str) -> None:
    a = sympify(expr_a)
    b = sympify(expr_b)
    assert (
        simplify(a - b) == 0
    ), f"Expressions are not symbolically equivalent: {expr_a} vs {expr_b}"
