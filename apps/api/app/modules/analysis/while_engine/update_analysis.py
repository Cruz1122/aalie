"""
Análisis de updates para el motor WHILE.

Delega a updates.summarize_updates.

Author: @Cruz1122
Version: 0.1.0
"""
from typing import Any, Dict, Optional, Set

from .updates import VarUpdateSummary, summarize_updates


def analyze_updates(
    while_node: Dict[str, Any],
    vars_used: Set[str],
    guard_info: Any,
    parent_context: Optional[Dict] = None,
) -> Dict[str, VarUpdateSummary]:
    """
    Analiza updates por variable.

    Usa summarize_updates.
    """
    body = while_node.get("body")
    # Normalizar cuerpo como bloque si viene como lista (parser puede devolver body así)
    if isinstance(body, list):
        body = {"type": "block", "body": body}
    return summarize_updates(body, vars_used, guard_info, parent_context)
