"""
Análisis de guards para el motor WHILE.

Wrapper sobre el módulo while_analysis.guard para uso desde el engine.
En el futuro puede extenderse con análisis sobre CFG.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any

from .guard import GuardInfo, analyze_guard


def analyze_guard_for_engine(test: Any) -> GuardInfo:
    """Analiza el guard de un WHILE. Delega a guard.analyze_guard."""
    return analyze_guard(test)
