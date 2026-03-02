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
    print(f"DEBUG CLASSIFIER: guard={guard.kind}, atom={guard.atoms if hasattr(guard, 'atoms') else None}, bool_var={guard.bool_var}, desired={guard.desired}")
    if guard.kind == "const" and guard.const_value is True:
        return ClassifyResult(
            status="unbounded",
            reason_code="while_const_true",
            evidence={},
        )

def _classify_bool_guard(guard: GuardInfo, updates: Dict[str, VarUpdateSummary], parent_context: Optional[Dict], while_line: int, mode: str) -> Optional[ClassifyResult]:
    """Lógica específica para guards de tipo bool_var."""
    if guard.bool_var:
        summary = updates.get(guard.bool_var)
        if summary and not summary.kills_guard_must:
            # Si no hay kill must y desired=True, es potencialmente unbounded (si es While flag)
            return ClassifyResult(
                status="unbounded",
                reason_code="while_bool_no_must_kill",
                evidence={"var": guard.bool_var},
            )
        if summary and summary.kills_guard_must:
            if getattr(summary, "revives_guard_may", False) and mode != "best":
                for v_name, v_summary in updates.items():
                    # Ignorar variables que se reinician (ej. i <- 1 en cada pasada)
                    has_reset = any(u.get("type") == "reset" for u in v_summary.must_updates + v_summary.may_updates)
                    if v_name != guard.bool_var and v_summary.monotone_progress_must and not has_reset:
                        initial_b = _find_initial_value(v_name, while_line, parent_context) if parent_context else None
                        initial_b = initial_b if initial_b else f"{v_name}_0"
                        return ClassifyResult(
                            status="bounded",
                            iterations_expr=initial_b,
                            reason_code="while_flag_monotone_bound",
                            evidence={"var": guard.bool_var, "bound_var": v_name},
                        )
                return ClassifyResult(status="unknown", reason_code="while_bool_revived")
            else:
                # En BEST mode, o si no hay revival, el flag se mata -> 1 iteración
                return ClassifyResult(
                    status="bounded",
                    iterations_expr="1",
                    reason_code="while_bool_kills",
                    evidence={"var": guard.bool_var},
                )
    return None


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
    print(f"DEBUG CLASSIFIER: guard={guard.kind}, atom={guard.atoms if hasattr(guard, 'atoms') else None}, bool_var={guard.bool_var}, desired={guard.desired}")
    if guard.kind == "const" and guard.const_value is True:
        return ClassifyResult(
            status="unbounded",
            reason_code="while_const_true",
            evidence={},
        )

    # --- UNBOUNDED/BOUNDED: Guard booleano ---
    if guard.kind == "bool_var":
        res = _classify_bool_guard(guard, updates, parent_context, while_line, mode)
        if res:
            return res

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

    # --- OR: Bounded solo si TODOS los disyuntos están acotados ---
    if guard.kind == "or":
        sub_results = []
        components = []
        if getattr(guard, "atoms", None):
            for atom in guard.atoms:
                components.append(GuardInfo(kind="rel", atoms=[atom], vars_used=guard.vars_used))
        if getattr(guard, "or_bool_vars", None):
             for bvar in guard.or_bool_vars:
                 components.append(GuardInfo(kind="bool_var", bool_var=bvar, desired=True, vars_used=guard.vars_used))
        
        if not components:
            return ClassifyResult(status="unknown", reason_code="while_or_empty")

        for comp in components:
            res = classify_while(comp, updates, mode, parent_context, while_line)
            sub_results.append(res)
            
        if all(r.status == "bounded" for r in sub_results):
            exprs = [str(r.iterations_expr) for r in sub_results if r.iterations_expr]
            if not exprs:
                return ClassifyResult(status="unknown", reason_code="while_or_no_expr")
            return ClassifyResult(
                status="bounded",
                iterations_expr=f"Max({', '.join(exprs)})",
                reason_code="while_or_bounded",
                evidence={"sub_results": len(sub_results)}
            )
        
        if any(r.status == "unbounded" for r in sub_results):
            unb = next(r for r in sub_results if r.status == "unbounded")
            return ClassifyResult(status="unbounded", reason_code=unb.reason_code, evidence=unb.evidence)
            
        return ClassifyResult(status="unknown", reason_code="while_or_unknown")

    # --- AND: Bounded si AL MENOS uno está acotado ---
    if guard.kind == "and":
        bounded_results = []
        components = []
        if getattr(guard, "atoms", None):
            for atom in guard.atoms:
                components.append(GuardInfo(kind="rel", atoms=[atom], vars_used=guard.vars_used))
        
        # En AND, recopilar variables booleanas también (si existen)
        if hasattr(guard, "and_bool_vars"):
            for bvar in guard.and_bool_vars:
                components.append(GuardInfo(kind="bool_var", bool_var=bvar, desired=True, vars_used=guard.vars_used, atoms=[]))
        
        for comp in components:
            res = classify_while(comp, updates, mode, parent_context, while_line)
            if res.status == "bounded":
                bounded_results.append(res)
        
        if bounded_results:
            if mode == "best":
                # PRIORIDAD: Si alguno es un flag killed (1 iteración), tomarlo
                for r in bounded_results:
                    if str(r.iterations_expr) == "1":
                        return r
                
                # Si no hay 1, tomar el mínimo de las expresiones (Min)
                if len(bounded_results) == 1:
                    return bounded_results[0]
                
                exprs = [str(r.iterations_expr) for r in bounded_results if r.iterations_expr]
                return ClassifyResult(
                    status="bounded",
                    iterations_expr=f"Min({', '.join(exprs)})",
                    reason_code="while_and_bounded_best",
                    evidence={"bounded_count": len(bounded_results)}
                )

            # WORST case: primer acotado (estructural)
            return bounded_results[0]

        return ClassifyResult(status="unknown", reason_code="while_and_unknown")

    return ClassifyResult(status="unknown", reason_code="while_unbounded_unknown")
