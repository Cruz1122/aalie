"""
Pruebas de progreso para bucles WHILE.

Construye ranking expressions y determina si hay terminación demostrable.

Author: @Cruz1122
Version: 0.1.0
"""
from dataclasses import dataclass
from typing import Any, List, Optional

from sympy import Expr


@dataclass
class ProgressProof:
    """Resultado de prueba de progreso."""

    proven: bool
    ranking_expr: Optional[Expr] = None
    bound_kind: str = "unknown"  # linear | logarithmic | interval | modular | boolean | unknown
    must_progress: bool = False
    may_stall: bool = False
    may_reset: bool = False
    evidence: List[str] = None

    def __post_init__(self):
        if self.evidence is None:
            self.evidence = []


def prove_progress(
    guard_info: Any,
    updates: Any,
    control_vars: Any,
) -> ProgressProof:
    """
    Prueba si el bucle tiene progreso demostrable.

    Usa la información de guard, updates y control variables.
    """
    evidence: List[str] = []
    bound_kind = "unknown"
    ranking_expr = None
    must_progress = False
    may_stall = False
    may_reset = False

    # Flag con kill must
    if control_vars and getattr(control_vars, "primary_boolean_controller", None):
        var = control_vars.primary_boolean_controller
        summary = updates.get(var) if isinstance(updates, dict) else None
        if summary and getattr(summary, "kills_guard_must", False):
            must_progress = True
            bound_kind = "boolean"
            evidence.append(f"flag {var} killed on all paths")
        if summary and getattr(summary, "revives_guard_may", False):
            may_stall = True

    # Numérico monotónico
    if control_vars and getattr(control_vars, "primary_numeric_controller", None):
        var = control_vars.primary_numeric_controller
        summary = updates.get(var) if isinstance(updates, dict) else None
        if summary and getattr(summary, "monotone_progress_must", False):
            must_progress = True
            for u in getattr(summary, "must_updates", []):
                if u.get("type") == "num":
                    op = u.get("operator", "")
                    if op in ("+", "*"):
                        bound_kind = "linear" if op == "+" else "logarithmic"
                    elif op in ("-", "/", "//"):
                        bound_kind = "linear"
                elif u.get("type") == "mod_decrease":
                    bound_kind = "modular"
                    evidence.append("Euclid MOD pattern")

    # Reset
    if isinstance(updates, dict):
        for var, summary in updates.items():
            for u in getattr(summary, "must_updates", []):
                if u.get("type") == "reset":
                    may_reset = True
                    evidence.append(f"reset of {var}")

    proven = must_progress and not may_reset
    return ProgressProof(
        proven=proven,
        ranking_expr=ranking_expr,
        bound_kind=bound_kind,
        must_progress=must_progress,
        may_stall=may_stall,
        may_reset=may_reset,
        evidence=evidence,
    )
