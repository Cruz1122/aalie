"""
Patrón: binary search iterativo por reducción de intervalo.

Author: @Cruz1122
Version: 0.1.0
"""
from typing import Any, Dict
from .base import WhilePattern, TerminationResult, IterationBoundResult


class BinarySearchIntervalPattern(WhilePattern):
    """Detecta binary search por low <= high y reducción de intervalo."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        control = while_ctx.get("control_variables")
        if not guard or not control:
            return False
        coupled = getattr(control, "coupled_controllers", []) or []
        if len(coupled) < 2:
            return False
        atoms = getattr(guard, "atoms", []) or []
        for atom in atoms:
            if isinstance(atom, dict) and atom.get("two_vars"):
                op = atom.get("op", "")
                if op in ("<=", "<"):
                    return True
        return False

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        return IterationBoundResult(
            exact_symbolic_bound="log(n)",
            asymptotic_bound="O(log n)",
            not_proven=False,
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Binary search: low <= high, interval halving"]
