"""
Patrón: Centinela scan lineal

Detecta una búsqueda lineal con centinela:
WHILE (A[i] != x) DO BEGIN
  i <- i + 1;
END
Antes del WHILE suele existir A[n] <- x.

En el motor actual lo tratamos como una progresión lineal MUST del índice.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from .base import IterationBoundResult, TerminationResult, WhilePattern


def _has_relational_array_guard(while_node: Dict[str, Any], guard_info: Any) -> bool:
    # Guard con acceso a array (A[...])
    if not getattr(guard_info, "has_array_access", False):
        return False
    test = while_node.get("test") or {}
    if not isinstance(test, dict):
        return False
    op = (test.get("op") or test.get("operator") or "").lower()
    return op in ("!=", "<>", "=/=", "!==")


def _find_monotone_linear_index(updates: Any) -> Optional[str]:
    """
    Encuentra un candidato de índice con update MUST de la forma i <- i + 1.
    """
    if not isinstance(updates, dict):
        return None
    for v_name, summary in updates.items():
        if not summary:
            continue
        for u in getattr(summary, "must_updates", []) or []:
            if u.get("type") == "num" and u.get("monotone") is True:
                if u.get("operator") == "+" and str(u.get("constant", "")).strip() == "1":
                    return str(v_name)
    return None


class SentinelScanPattern(WhilePattern):
    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        while_node = while_ctx.get("while_node") or {}
        updates = while_ctx.get("updates", {}) or {}
        if not guard or not updates:
            return False
        if not _has_relational_array_guard(while_node, guard):
            return False
        return _find_monotone_linear_index(updates) is not None

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        mode = str(while_ctx.get("mode") or "worst")
        if mode == "best":
            exact = "1"
            asymptotic = "O(1)"
            klass = "constant"
        else:
            exact = "n"
            asymptotic = "O(n)"
            klass = "linear"
        return IterationBoundResult(
            exact_symbolic_bound=exact,
            asymptotic_bound=asymptotic,
            not_proven=False,
            iterations_class=klass,
            evidence_level="medium",
            reason_code="while_sentinel_scan",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Sentinel scan: i increases by 1 until A[i] == x"]

