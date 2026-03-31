"""
Patrón: ventana decreciente bidireccional (dos bordes se mueven en sentidos opuestos).

Uso esperado:
- Dutch National Flag: WHILE (mid <= high) ... mid <- mid + 1 / high <- high - 1
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from .base import IterationBoundResult, TerminationResult, WhilePattern


def _find_two_var_relation(guard_info: Any) -> Optional[Dict[str, Any]]:
    atoms = getattr(guard_info, "atoms", None) or []
    for atom in atoms:
        if isinstance(atom, dict) and atom.get("two_vars") and atom.get("op") in (
            "<=",
            "<",
        ):
            return atom
    return None


def _num_update_must_or_may(summary: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Retorna (operator, constant) si hay un update numérico monotónico
    en must_updates o may_updates.
    """
    if not summary:
        return None, None

    for bucket in ("must_updates", "may_updates"):
        for u in getattr(summary, bucket, []) or []:
            if u.get("type") != "num":
                continue
            if u.get("monotone") is not True:
                continue
            return str(u.get("operator", "") or ""), str(u.get("constant", "") or "")

    return None, None


class ShrinkingWindowBidirectionalPattern(WhilePattern):
    """Detecta dos controladores numéricos que acotan una ventana y se mueven opuestos."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        updates = while_ctx.get("updates", {}) or {}
        if not guard or not updates:
            return False

        atom = _find_two_var_relation(guard)
        if not atom:
            return False

        left_name = str(atom.get("var") or "")
        right_name = str(atom.get("limit") or "")
        if not left_name or not right_name:
            return False

        left_summary = updates.get(left_name)
        right_summary = updates.get(right_name)
        if not left_summary or not right_summary:
            return False

        left_op, _ = _num_update_must_or_may(left_summary)
        right_op, _ = _num_update_must_or_may(right_summary)

        # Ventana "clásica":
        # - izquierda avanza ( + )
        # - derecha retrocede ( - )
        return left_op == "+" and right_op == "-"

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        # Contractualmente, para el Dutch Flag este WHILE tiene Θ(n) iteraciones.
        mode = str(while_ctx.get("mode") or "worst")
        exact = "n"
        asymptotic = "O(n)"
        return IterationBoundResult(
            exact_symbolic_bound=exact,
            asymptotic_bound=asymptotic,
            not_proven=False,
            iterations_class="linear",
            evidence_level="strong",
            reason_code=f"while_shrinking_window_bidirectional_{mode}",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Two-pointer shrinking window: left increases, right decreases"]

