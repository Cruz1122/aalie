"""
Clasificador de terminación de bucles WHILE.

Retorna bounded, unbounded o unknown según guard y updates.
Reglas conservadoras para unbounded; patrones existentes para bounded.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from ..ir.expr_utils import expr_to_str
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
                            last_val = expr_to_str(val)  # Identifier, Binary, etc.
                    elif val:
                        last_val = "?"
    return last_val


def _classify_bool_guard(guard: GuardInfo, updates: Dict[str, VarUpdateSummary], parent_context: Optional[Dict], while_line: int, mode: str) -> Optional[ClassifyResult]:
    """Lógica específica para guards de tipo bool_var."""
    if guard.bool_var:
        summary = updates.get(guard.bool_var)
        if summary:
            # Caso: guard booleano sin kill must.
            # - Si el WHILE depende únicamente de este flag, es potencialmente no terminante.
            # - En guards compuestos (AND), este flag no impone una cota superior útil por sí solo.
            if not summary.kills_guard_must:
                return ClassifyResult(
                    status="unbounded",
                    reason_code="while_bool_no_must_kill",
                    evidence={"var": guard.bool_var},
                )

            # Caso: el flag se mata en todos los caminos (kills_guard_must=True).
            # Si además puede revivir (revives_guard_may=True), en worst/avg no tenemos una cota
            # derivable del flag (puede mantenerse true por muchas iteraciones).
            if getattr(summary, "revives_guard_may", False):
                if mode == "best":
                    return ClassifyResult(
                        status="bounded",
                        iterations_expr="1",
                        reason_code="while_bool_kills",
                        evidence={"var": guard.bool_var},
                    )
                # WORST/AVG: si el flag puede revivir, el flag por sí solo no acota.
                # Sin embargo, algunos patrones (p.ej. bubble sort con indiceLimite-- o con
                # contador i que crece en must) garantizan un número finito de pasadas gracias
                # a una variable auxiliar de control.
                for v_name, v_summary in updates.items():
                    if v_name == guard.bool_var:
                        continue
                    # Ignorar variables con reset (re-inicialización) en la iteración del while
                    has_reset = any(u.get("type") == "reset" for u in (v_summary.must_updates + v_summary.may_updates))
                    if has_reset:
                        continue
                    # Buscar actualización numérica MUST como cota de pasadas
                    for u in v_summary.must_updates:
                        if u.get("type") != "num":
                            continue
                        op = u.get("operator")
                        const = u.get("constant", "1")
                        initial_b = _find_initial_value(v_name, while_line, parent_context) if parent_context else None
                        initial_expr = initial_b if initial_b else f"{v_name}_0"

                        # Caso 1: variable auxiliar decreciente (patrones tipo índice límite)
                        if op in ("-", "/", "//"):
                            if op == "-":
                                # Cota superior conservadora: O(initial/const)
                                if const == "1":
                                    iterations = f"({initial_expr})"
                                else:
                                    iterations = f"({initial_expr}) / ({const})"
                                return ClassifyResult(
                                    status="bounded",
                                    iterations_expr=iterations,
                                    reason_code="while_flag_aux_decrease_bound",
                                    evidence={
                                        "var": v_name,
                                        "limit": "0",
                                        "op": ">",
                                        "change": f"-{const}",
                                        "flag": guard.bool_var,
                                    },
                                )
                            # División: O(log(initial))
                            iterations = f"\\log_{{{const}}}(({initial_expr}))"
                            return ClassifyResult(
                                status="bounded",
                                iterations_expr=iterations,
                                reason_code="while_flag_aux_decrease_bound",
                                evidence={
                                    "var": v_name,
                                    "limit": "1",
                                    "op": ">",
                                    "change_operator": op,
                                    "change_constant": const,
                                    "flag": guard.bool_var,
                                },
                            )

                        # Caso 2: variable auxiliar creciente (patrón bubbleSortImproved sin i<n en guard):
                        # si incrementa en must y no se resetea, acotamos conservadoramente el número
                        # de pasadas por la variable de tamaño principal n.
                        if op == "+":
                            iterations = "n"
                            return ClassifyResult(
                                status="bounded",
                                iterations_expr=iterations,
                                reason_code="while_flag_aux_increase_bound",
                                evidence={
                                    "var": v_name,
                                    "change": f"+{const}",
                                    "flag": guard.bool_var,
                                },
                            )

                return ClassifyResult(
                    status="bounded",
                    iterations_expr="1",
                    reason_code="while_bool_revived",
                    evidence={"var": guard.bool_var},
                )

            # Kill must y sin revival: máximo 1 iteración.
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
    compound: bool = False,
    compound_op: Optional[str] = None,
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

    # --- UNBOUNDED/BOUNDED: Guard booleano ---
    if guard.kind == "bool_var":
        res = _classify_bool_guard(guard, updates, parent_context, while_line, mode)
        if res:
            # En contexto compuesto (AND), un flag sin kill must no implica no terminación del WHILE completo:
            # la otra parte del AND puede terminar el bucle. En OR, sí puede volver el WHILE no terminante.
            if compound and compound_op == "and" and res.status == "unbounded" and res.reason_code == "while_bool_no_must_kill":
                return ClassifyResult(status="unknown", reason_code="while_bool_compound_unknown", evidence=res.evidence)
            return res

    # --- Relacionales numéricos ---
    if guard.kind == "rel" and guard.atoms:
        atom = guard.atoms[0]
        if atom.get("two_vars"):
            # Caso común: i < n, ambos son identificadores pero solo i se actualiza.
            # Si la "variable límite" no cambia dentro del while, tratarla como cota fija.
            limit_var = atom.get("limit")
            limit_summary = updates.get(limit_var) if isinstance(limit_var, str) else None
            limit_has_updates = bool(
                limit_summary
                and (
                    getattr(limit_summary, "must_updates", None)
                    or getattr(limit_summary, "may_updates", None)
                )
            )
            if not limit_has_updates:
                atom = {
                    "var": atom.get("var"),
                    "limit": atom.get("limit"),
                    "op": atom.get("op", ""),
                }
            else:
                return ClassifyResult(status="unknown", reason_code="while_two_vars")
        # Si este "atom" representa una igualdad booleana (var == true/false), no tratarlo como rel.
        if atom.get("bool_desired") is not None:
            desired = bool(atom.get("bool_desired"))
            return classify_while(
                GuardInfo(kind="bool_var", bool_var=atom.get("var"), desired=desired, vars_used={atom.get("var", "")}),
                updates,
                mode,
                parent_context,
                while_line,
                compound=compound,
                compound_op=compound_op,
            )
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
                if change_op in ("*", "/", "//", "div") and op in ("<", "<="):
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
                if change_op in ("/", "//", "div") and op in (">", ">="):
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
                if atom.get("bool_desired") is not None:
                    components.append(
                        GuardInfo(
                            kind="bool_var",
                            bool_var=atom.get("var"),
                            desired=bool(atom.get("bool_desired")),
                            vars_used=guard.vars_used,
                            atoms=[],
                        )
                    )
                else:
                    components.append(GuardInfo(kind="rel", atoms=[atom], vars_used=guard.vars_used))
        if getattr(guard, "or_bool_vars", None):
             for bvar in guard.or_bool_vars:
                 components.append(GuardInfo(kind="bool_var", bool_var=bvar, desired=True, vars_used=guard.vars_used))

        if not components:
            return ClassifyResult(status="unknown", reason_code="while_or_empty")

        for comp in components:
            res = classify_while(comp, updates, mode, parent_context, while_line, compound=True, compound_op="or")
            sub_results.append(res)

        if all(r.status == "bounded" for r in sub_results):
            exprs = [str(r.iterations_expr) for r in sub_results if r.iterations_expr]
            if not exprs:
                return ClassifyResult(status="unknown", reason_code="while_or_no_expr")
            # OR conservador: en general, la iteración puede alternar entre disyuntos.
            # Usar suma como cota superior segura para evitar subestimación.
            return ClassifyResult(
                status="bounded",
                iterations_expr=" + ".join(exprs),
                reason_code="while_or_bounded_sum",
                evidence={"sub_results": len(sub_results)},
            )

        if any(r.status == "unbounded" for r in sub_results):
            unb = next(r for r in sub_results if r.status == "unbounded")
            return ClassifyResult(status="unbounded", reason_code=unb.reason_code, evidence=unb.evidence)

        return ClassifyResult(status="unknown", reason_code="while_or_unknown")

    # --- AND: Bounded si AL MENOS uno está acotado ---
    if guard.kind == "and":
        components = []
        if getattr(guard, "atoms", None):
            for atom in guard.atoms:
                if atom.get("bool_desired") is not None:
                    components.append(
                        GuardInfo(
                            kind="bool_var",
                            bool_var=atom.get("var"),
                            desired=bool(atom.get("bool_desired")),
                            vars_used=guard.vars_used,
                            atoms=[],
                        )
                    )
                else:
                    components.append(GuardInfo(kind="rel", atoms=[atom], vars_used=guard.vars_used))

        # En AND, recopilar variables booleanas también (si existen)
        if hasattr(guard, "and_bool_vars"):
            for bvar in guard.and_bool_vars:
                components.append(GuardInfo(kind="bool_var", bool_var=bvar, desired=True, vars_used=guard.vars_used, atoms=[]))

        sub_results: List[ClassifyResult] = []
        for comp in components:
            sub_results.append(classify_while(comp, updates, mode, parent_context, while_line, compound=True, compound_op="and"))

        bounded = [r for r in sub_results if r.status == "bounded" and r.iterations_expr]
        if not bounded:
            return ClassifyResult(status="unknown", reason_code="while_and_unknown")

        # BEST: priorizar 1 iteración (kill must sin revival u otra cota inmediata)
        if mode == "best":
            for r in bounded:
                if str(r.iterations_expr) == "1":
                    return r
            if len(bounded) == 1:
                return bounded[0]
            exprs = [str(r.iterations_expr) for r in bounded]
            return ClassifyResult(
                status="bounded",
                iterations_expr=f"Min({', '.join(exprs)})",
                reason_code="while_and_bounded_best",
                evidence={"bounded_count": len(bounded)},
            )

        # WORST/AVG: el número de iteraciones está acotado por el primer guard que falle.
        # Las partes unknown/unbounded no reducen la cota; usar Min solo sobre cotas finitas conocidas.
        if len(bounded) == 1:
            return bounded[0]
        exprs = [str(r.iterations_expr) for r in bounded]
        # Preservar evidencia del primer bounded (útil para WhileRepeatVisitor).
        base_ev = dict(bounded[0].evidence or {})
        base_ev["bounded_count"] = len(bounded)
        return ClassifyResult(
            status="bounded",
            iterations_expr=f"Min({', '.join(exprs)})",
            reason_code="while_and_bounded_worst",
            evidence=base_ev,
        )

    return ClassifyResult(status="unknown", reason_code="while_unbounded_unknown")
