"""
Utilidades compartidas para builders que usan árbol de llamadas.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from typing import Any, Dict, List, Optional


def _locale_key(locale: str) -> str:
    return "es" if str(locale).lower().startswith("es") else "en"


def _t(locale: str, en: str, es: str) -> str:
    return es if _locale_key(locale) == "es" else en


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
        if _is_linked_list(v):
            return _format_linked_list(v)
        if _is_bst_node(v):
            return _format_bst_node(v)
        return "[...]"
    return str(v)


def _is_linked_list(d: Dict[str, Any]) -> bool:
    """Detecta si es un nodo de lista enlazada."""
    return ("siguiente" in d or "next" in d) and ("valor" in d or "value" in d)


def _is_bst_node(d: Dict[str, Any]) -> bool:
    """Detecta si es un nodo de árbol binario de búsqueda."""
    has_value = "valor" in d or "value" in d
    has_children = any(k in d for k in ("izquierda", "derecha", "left", "right"))
    return has_value and has_children


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


def _format_bst_node(node: Dict[str, Any]) -> str:
    """Formatea nodo BST de forma compacta."""
    value = node.get("valor") if "valor" in node else node.get("value")
    left = node.get("izquierda") if "izquierda" in node else node.get("left")
    right = node.get("derecha") if "derecha" in node else node.get("right")
    left_tag = "ok" if isinstance(left, dict) else "null"
    right_tag = "ok" if isinstance(right, dict) else "null"
    return f"nodo({value}, izq={left_tag}, der={right_tag})"


def call_to_label(call: Dict[str, Any], locale: str = "en") -> str:
    """Genera label legible: factorial(n=4) → 24."""
    params = call.get("params", {})
    final_params = call.get("final_params", {})
    param_strs = [f"{k}={_format_param_value(v)}" for k, v in params.items()]
    pstr = ", ".join(param_strs) if param_strs else ""
    fn = call.get("function_name") or "proc"
    bc = call.get("base_case") or {}
    base = call.get("is_base_case", False) or (
        bc.get("detected", False) and bc.get("matched", False)
    )
    ret = call.get("return_value")
    label_parts = [f"{fn}({pstr})"]
    if isinstance(final_params, dict) and final_params:
        changed = {k: v for k, v in final_params.items() if params.get(k) != v}
        if changed:
            final_str = ", ".join(f"{k}={_format_param_value(v)}" for k, v in changed.items())
            label_parts.append(f"{_t(locale, 'final', 'estado final')}: {final_str}")
    if base:
        label_parts.append(_t(locale, "(base)", "(caso base)"))
    if ret is not None:
        label_parts.append(f"→ {_format_param_value(ret)}")
    return "\n".join(label_parts)
