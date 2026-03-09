"""
Patrón: bandera booleana con kill real (flag, flag <- false).

Author: @Cruz1122
Version: 0.1.0
"""
from typing import Any, Dict
from .base import WhilePattern, TerminationResult, IterationBoundResult


class FlagKillPattern(WhilePattern):
    """Detecta while con flag booleano que se mata en todos los caminos."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        updates = while_ctx.get("updates", {})
        if not guard or not updates:
            return False
        bool_var = getattr(guard, "bool_var", None)
        if not bool_var:
            return False
        summary = updates.get(bool_var)
        return summary is not None and getattr(summary, "kills_guard_must", False)

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        return IterationBoundResult(
            exact_symbolic_bound="1",
            asymptotic_bound="O(1)",
            not_proven=False,
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Boolean flag with kill on all paths"]
