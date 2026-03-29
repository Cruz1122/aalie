"""
Patrón: binary search iterativo por reducción de intervalo.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict

from .base import IterationBoundResult, TerminationResult
from .interval_shrink import (
    IntervalShrinkPattern,
    _has_returning_equality,
    interval_shrink_signature,
)


class BinarySearchIntervalPattern(IntervalShrinkPattern):
    """Detecta binary search por low <= high y reducción de intervalo."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        signature = interval_shrink_signature(while_ctx)
        return bool(signature and signature.get("kind") == "midpoint" and signature.get("divisor") == 2)

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        signature = interval_shrink_signature(while_ctx) or {}
        size_symbol = str(signature.get("size_symbol") or "n")
        mode = str(while_ctx.get("mode") or "worst")
        helper_names = set(signature.get("helper_names") or set())
        while_node = while_ctx.get("while_node") or {}
        if (
            mode == "best"
            and helper_names
            and _has_returning_equality(while_node.get("body"), helper_names)
        ):
            return IterationBoundResult(
                exact_symbolic_bound="1",
                asymptotic_bound="O(1)",
                not_proven=False,
                iterations_class="constant",
                evidence_level="strong",
            )
        return IterationBoundResult(
            exact_symbolic_bound=f"\\log_{{2}}({size_symbol})",
            asymptotic_bound="O(log n)",
            not_proven=False,
            iterations_class="logarithmic",
            evidence_level="strong",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Binary search: low <= high, interval halving"]
