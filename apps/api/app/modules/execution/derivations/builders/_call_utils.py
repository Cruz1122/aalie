"""
Utilidades compartidas para builders que usan árbol de llamadas.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, List, Optional


def _format_param_value(v: Any) -> str:
    """Formatea un valor de parámetro para legibilidad."""
    if v is None:
        return "null"
    if isinstance(v, (int, float, str)):
        return str(v)
    if isinstance(v, list):
        if len(v) <= 20:
            return "[" + ", ".join(str(x) for x in v) + "]"
        preview = ", ".join(str(x) for x in v[:20])
        return f"[{preview}, ...]"
    if isinstance(v, dict):
        return _format_linked_list(v) if _is_linked_list(v) else "[...]"
    return str(v)


def _is_linked_list(d: Dict[str, Any]) -> bool:
    """Detecta si es un nodo de lista enlazada."""
    return "siguiente" in d or "valor" in d


def _format_linked_list(head: Dict[str, Any], max_depth: int = 5) -> str:
    """Formatea lista enlazada como 1→2→3→4."""
    parts: List[str] = []
    node: Optional[Dict[str, Any]] = head
    depth = 0
    while node and depth < max_depth:
        val = node.get("valor") if "valor" in node else node.get("value")
        if val is not None:
            parts.append(str(val))
        node = node.get("siguiente") or node.get("next")
        depth += 1
    if node and depth >= max_depth:
        return "→".join(parts) + "→..."
    return "→".join(parts) if parts else "lista"


def call_to_label(call: Dict[str, Any]) -> str:
    """Genera label legible: factorial(n=4) → 24."""
    params = call.get("params", {})
    param_strs = [f"{k}={_format_param_value(v)}" for k, v in params.items()]
    pstr = ", ".join(param_strs) if param_strs else ""
    fn = call.get("function_name") or "proc"
    bc = call.get("base_case") or {}
    base = call.get("is_base_case", False) or (
        bc.get("detected", False) and bc.get("matched", False)
    )
    ret = call.get("return_value")
    label_parts = [f"{fn}({pstr})"]
    if base:
        label_parts.append("(base)")
    if ret is not None:
        label_parts.append(f"→ {ret}")
    return "\n".join(label_parts)
