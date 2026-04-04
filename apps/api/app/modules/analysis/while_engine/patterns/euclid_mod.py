"""
Patrón: Euclides con MOD (b <- a MOD b).

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict

from .base import IterationBoundResult, TerminationResult, WhilePattern


class EuclidModPattern(WhilePattern):
    """Detecta algoritmo de Euclides (b <- a MOD b)."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        updates = while_ctx.get("updates", {})
        if not updates:
            return False
        for var, summary in updates.items():
            for u in getattr(summary, "must_updates", []):
                if u.get("type") == "mod_decrease":
                    return True
        return False

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        mode = str(while_ctx.get("mode") or "worst")
        if mode == "best":
            # Best-case: el bucle puede no ejecutarse (p.ej. b = 0 inicialmente).
            # El costo queda dominado por el chequeo de salida del guard => O(1).
            return IterationBoundResult(
                exact_symbolic_bound="0",
                asymptotic_bound="O(1)",
                not_proven=False,
                iterations_class="constant",
                evidence_level="strong",
                reason_code="euclid_mod_best_zero_iterations",
            )
        return IterationBoundResult(
            exact_symbolic_bound="min(a, b)",
            asymptotic_bound="O(log(min(a,b)))",
            not_proven=False,
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Euclid MOD: b <- a MOD b decreases second operand"]
