"""
Módulo de análisis de guards y clasificación de bucles WHILE.

Proporciona GuardInfo, UpdateSummary, classify_while para distinguir
bounded/unbounded/unknown en bucles WHILE.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""
from .guard import GuardInfo, analyze_guard
from .updates import VarUpdateSummary, summarize_updates
from .classifier import ClassifyResult, classify_while

__all__ = [
    "GuardInfo",
    "analyze_guard",
    "VarUpdateSummary",
    "summarize_updates",
    "ClassifyResult",
    "classify_while",
]
