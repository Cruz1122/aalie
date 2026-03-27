"""
Patrón: contador lineal creciente (i < n, i <- i + c).

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict

from .base import IterationBoundResult, TerminationResult, WhilePattern


class LinearCounterPattern(WhilePattern):
    """Detecta while con contador lineal creciente."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        updates = while_ctx.get("updates", {})
        if not guard or not updates:
            return False
        atoms = getattr(guard, "atoms", []) or []
        for atom in atoms:
            if not isinstance(atom, dict):
                continue
            var = atom.get("var")
            op = atom.get("op", "")
            if var and op in ("<", "<="):
                summary = updates.get(var)
                if summary:
                    for u in getattr(summary, "must_updates", []):
                        if u.get("type") == "num" and u.get("operator") == "+":
                            return True
        return False

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        guard = while_ctx.get("guard_info")
        main_var = "n"
        atoms = getattr(guard, "atoms", []) or []
        for atom in atoms:
            if isinstance(atom, dict) and atom.get("limit"):
                main_var = str(atom.get("limit", "n"))
                break
        return IterationBoundResult(
            exact_symbolic_bound=main_var,
            asymptotic_bound="O(n)",
            not_proven=False,
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Linear counter: var < limit, var <- var + c"]
