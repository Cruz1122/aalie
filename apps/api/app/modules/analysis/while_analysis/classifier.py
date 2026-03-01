"""
Clasificador de terminación de bucles WHILE.

Retorna bounded, unbounded o unknown según guard y updates.
Reglas conservadoras para unbounded; patrones existentes para bounded.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .guard import GuardInfo
from .updates import VarUpdateSummary


@dataclass
class ClassifyResult:
    """
    Resultado de classify_while.

    Attributes:
        status: "bounded" | "unbounded" | "unknown"
        iterations_expr: Expresión SymPy o string para iteraciones (si bounded)
        reason_code: Clave para traducciones (while_const_true, while_bool_no_must_kill, etc.)
        evidence: Datos útiles (var, op, limit, update)
    """

    status: str  # "bounded" | "unbounded" | "unknown"
    iterations_expr: Optional[Any] = None
    reason_code: Optional[str] = None
    evidence: Dict[str, Any] = field(default_factory=dict)


def _find_initial_value(var_name: str, while_line: int, parent_context: Optional[Dict]) -> Optional[str]:
    """Busca valor inicial de var antes del while en parent_context."""
    if not parent_context or not isinstance(parent_context, dict):
        return None
    body = parent_context.get("body", [])
    if not isinstance(body, list):
        return None
    last_val = None
    for stmt in body:
        if not isinstance(stmt, dict):
            continue
        line = stmt.get("pos", {}).get("line", 0)
        if line >= while_line:
            break
        if stmt.get("type", "").lower() == "assign":
            target = stmt.get("target", {})
            if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                if target.get("name", "") == var_name:
                    val = stmt.get("value", {})
                    if isinstance(val, dict):
                        t = val.get("type", "").lower()
                        if t in ("number", "literal"):
                            last_val = str(val.get("value", ""))
                        else:
                            last_val = _expr_to_str(val)  # Identifier, Binary, etc.
                    elif val:
                        last_val = "?"
    return last_val


def _expr_to_str(expr: Any) -> str:
    """Convierte expresión a string."""
    if expr is None:
        return ""
    if isinstance(expr, (str, int, float)):
        return str(expr)
    if isinstance(expr, dict):
        t = expr.get("type", "").lower()
        if t == "identifier":
            return expr.get("name", "unknown")
        if t in ("number", "literal"):
            return str(expr.get("value", "0"))
        if t == "binary":
            left = _expr_to_str(expr.get("left"))
            right = _expr_to_str(expr.get("right"))
            op = expr.get("op", "") or expr.get("operator", "")
            return f"({left}) {op} ({right})"
    return str(expr)


def classify_while(
    guard: GuardInfo,
    updates: Dict[str, VarUpdateSummary],
    mode: str,
    parent_context: Optional[Dict] = None,
    while_line: int = 0,
) -> ClassifyResult:
    """
    Clasifica el WHILE como bounded, unbounded o unknown.

    Args:
        guard: GuardInfo del guard
        updates: Dict por variable con VarUpdateSummary
        mode: "worst" | "best" | "avg"
        parent_context: Bloque padre (para valor inicial)
        while_line: Línea del while

    Returns:
        ClassifyResult con status, iterations_expr, reason_code, evidence

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # --- UNBOUNDED: Guard constante True ---
    if guard.kind == "const" and guard.const_value is True:
        return ClassifyResult(
            status="unbounded",
            reason_code="while_const_true",
            evidence={},
        )

    # --- UNBOUNDED: Guard booleano sin kills_guard_must ---
    if guard.kind == "bool_var" and guard.bool_var and guard.desired is True:
        summary = updates.get(guard.bool_var)
        if summary and not summary.kills_guard_must:
            return ClassifyResult(
                status="unbounded",
                reason_code="while_bool_no_must_kill",
                evidence={"var": guard.bool_var},
            )
        if summary and summary.kills_guard_must:
            return ClassifyResult(
                status="bounded",
                iterations_expr="1",
                reason_code="while_bool_kills",
                evidence={"var": guard.bool_var},
            )

    # --- BOUNDED: Guard bool_var con desired=False (loop mientras false) ---
    if guard.kind == "bool_var" and guard.bool_var and guard.desired is False:
        summary = updates.get(guard.bool_var)
        if summary and summary.kills_guard_must:
            return ClassifyResult(
                status="bounded",
                iterations_expr="1",
                reason_code="while_bool_kills",
                evidence={"var": guard.bool_var},
            )

    # --- Relacionales numéricos ---
    if guard.kind == "rel" and guard.atoms:
        atom = guard.atoms[0]
        if atom.get("two_variables"):
            return ClassifyResult(status="unknown", reason_code="while_two_vars")
        var_name = atom.get("var")
        limit = atom.get("limit", "")
        op = atom.get("op", "")
        summary = updates.get(var_name) if var_name else None

        if not summary:
            return ClassifyResult(status="unknown", reason_code="while_no_updates")

        must = summary.must_updates
        if not must and summary.may_updates:
            return ClassifyResult(
                status="unbounded",
                reason_code="while_no_progress_must",
                evidence={"var": var_name},
            )

        for u in must:
            if u.get("type") == "mod_decrease" and op in (">", ">=", "!=", "<>"):
                # Euclid: var <- expr MOD var → var disminuye, bucle acotado
                other_var = u.get("other_var", "?")
                initial_b = _find_initial_value(var_name, while_line, parent_context) if parent_context else None
                initial_b = initial_b if initial_b else var_name
                # min(a,b) es cota superior conservadora para iteraciones de Euclides
                iterations = f"Min({other_var}, {initial_b})"
                return ClassifyResult(
                    status="bounded",
                    iterations_expr=iterations,
                    reason_code="while_euclid_mod",
                    evidence={"var": var_name, "other_var": other_var, "limit": limit, "op": op},
                )
            if u.get("type") == "num":
                change_op = u.get("operator", "")
                const = u.get("constant", "1")
                initial = _find_initial_value(var_name, while_line, parent_context) if parent_context else None
                initial_expr = initial if initial else f"{var_name}_0"

                if change_op == "+" and op in ("<", "<="):
                    if const == "1":
                        iterations = f"({limit}) - ({initial_expr})"
                    else:
                        iterations = f"(({limit}) - ({initial_expr})) / ({const})"
                    return ClassifyResult(
                        status="bounded",
                        iterations_expr=iterations,
                        reason_code="while_linear",
                        evidence={"var": var_name, "limit": limit, "op": op, "change": f"+{const}"},
                    )
                if change_op == "-" and op in (">", ">=", "!=", "<>"):
                    if const == "1":
                        iterations = f"({initial_expr}) - ({limit})"
                    else:
                        iterations = f"(({initial_expr}) - ({limit})) / ({const})"
                    return ClassifyResult(
                        status="bounded",
                        iterations_expr=iterations,
                        reason_code="while_decrement",
                        evidence={"var": var_name, "limit": limit, "op": op, "change": f"-{const}"},
                    )
                if change_op in ("*", "/", "//") and op in ("<", "<="):
                    iterations = f"\\log_{{{const}}}(({limit}) / ({initial_expr}))"
                    return ClassifyResult(
                        status="bounded",
                        iterations_expr=iterations,
                        reason_code="while_log",
                        evidence={
                            "var": var_name,
                            "limit": limit,
                            "change_operator": change_op,
                            "change_constant": const,
                        },
                    )
                # var > 0 (o var >= cte) con var <- var / c → iteraciones log_c(initial) o log(initial/limit) (genérico)
                if change_op in ("/", "//") and op in (">", ">="):
                    try:
                        is_zero = limit in ("0", "0.0") or (isinstance(limit, str) and limit.isdigit() and int(limit) == 0)
                    except (ValueError, TypeError):
                        is_zero = False
                    if is_zero:
                        iterations = f"\\log_{{{const}}}(({initial_expr}))"
                    else:
                        iterations = f"\\log_{{{const}}}(({initial_expr}) / ({limit}))"
                    return ClassifyResult(
                        status="bounded",
                        iterations_expr=iterations,
                        reason_code="while_log",
                        evidence={
                            "var": var_name,
                            "limit": limit,
                            "change_operator": change_op,
                            "change_constant": const,
                        },
                    )

        if must and any(u.get("type") == "reset" for u in must):
            return ClassifyResult(
                status="unbounded",
                reason_code="while_reset",
                evidence={"var": var_name},
            )

    # --- OR: unbounded si algún disyunto bool no tiene kill must ---
    if guard.kind == "or" and getattr(guard, "or_bool_vars", None):
        for var in guard.or_bool_vars:
            if not var:
                continue
            summary = updates.get(var)
            if summary and not summary.kills_guard_must:
                return ClassifyResult(
                    status="unbounded",
                    reason_code="while_or_no_progress",
                    evidence={"var": var},
                )

    if guard.kind == "or":
        return ClassifyResult(status="unknown", reason_code="while_or")

    if guard.kind == "and":
        return ClassifyResult(status="unknown", reason_code="while_and")

    return ClassifyResult(status="unknown", reason_code="while_unbounded_unknown")
