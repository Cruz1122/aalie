"""
Patrón: crecimiento geométrico (i <= n, i <- i * c con c > 1) → Θ(log n) iteraciones.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict

from .base import IterationBoundResult, TerminationResult, WhilePattern


class GeometricGrowthPattern(WhilePattern):
    """Detecta while con multiplicación (i <- i * 2, etc.) → O(log n) iteraciones."""

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
                        if u.get("type") == "num" and u.get("operator") == "*":
                            const = u.get("constant", "1")
                            try:
                                c = int(const) if "." not in str(const) else int(float(const))
                                if c > 1:
                                    return True
                            except (ValueError, TypeError):
                                pass
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
            exact_symbolic_bound=f"log({main_var})",
            asymptotic_bound="O(log n)",
            not_proven=False,
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Geometric growth: var <= limit, var <- var * c (c > 1) → Θ(log n)"]
