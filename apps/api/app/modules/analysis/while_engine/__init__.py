"""
Motor WHILE reingenierado.

Análisis estructural sin heurísticas por nombre.
Control variables, progress proofs, patrones.

Author: @Cruz1122
Version: 0.1.0
"""
from .classifier import ClassifyResult, classify_while
from .diagnostics import REASON_CODES
from .guard import GuardInfo, analyze_guard
from .updates import VarUpdateSummary, summarize_updates

__all__ = [
    "REASON_CODES",
    "GuardInfo",
    "analyze_guard",
    "VarUpdateSummary",
    "summarize_updates",
    "ClassifyResult",
    "classify_while",
]
