"""
Patrón: binary search iterativo por reducción de intervalo.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict

from .base import IterationBoundResult, TerminationResult, WhilePattern


class BinarySearchIntervalPattern(WhilePattern):
    """Detecta binary search por low <= high y reducción de intervalo."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        control = while_ctx.get("control_variables")
        updates = while_ctx.get("updates", {})
        if not guard or not control:
            return False
        coupled = getattr(control, "coupled_controllers", []) or []
        if len(coupled) < 2:
            return False

        # Evitar falsos positivos (ej. i < n): requerir que ambos controladores
        # del intervalo tengan evidencia de actualización dentro del while.
        for var_name in coupled:
            summary = updates.get(var_name) if isinstance(updates, dict) else None
            has_updates = bool(
                summary
                and (
                    getattr(summary, "must_updates", None)
                    or getattr(summary, "may_updates", None)
                )
            )
            if not has_updates:
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
