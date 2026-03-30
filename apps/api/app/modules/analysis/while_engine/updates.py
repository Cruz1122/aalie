"""
Análisis de updates (asignaciones) en el cuerpo del WHILE.

Calcula must_updates vs may_updates por variable, kills_guard_must,
y monotone_progress_must para clasificación de terminación.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from ..ir.expr_utils import (
    expr_to_str,
    is_literal_false,
    is_literal_true,
    is_simple_constant,
)


@dataclass
class VarUpdateSummary:
    """
    Resumen de updates para una variable del guard.

    Attributes:
        must_updates: Updates que ocurren en todos los caminos
        may_updates: Updates que ocurren en algún camino
        kills_guard_must: True si hay update must que apaga el guard (ej. flag <- false)
        monotone_progress_must: True si hay progreso monotónico must (ej. i <- i+1 con i<n)
    """

    must_updates: List[Dict[str, Any]] = field(default_factory=list)
    may_updates: List[Dict[str, Any]] = field(default_factory=list)
    kills_guard_must: bool = False
    revives_guard_may: bool = False
    monotone_progress_must: bool = False


def _parse_update(value: Any, var_name: str) -> Optional[Dict[str, Any]]:
    """
    Parsea una asignación value y retorna tipo de update si aplica.
    Retorna {type, operator?, constant?, kills_guard?, monotone?} o None.
    """
    if not isinstance(value, dict):
        return None

    t = value.get("type", "").lower()
    op = value.get("op", "") or value.get("operator", "")

    # Boolean: flag <- false / flag <- true (Literal, Number o Identifier)
    if is_literal_false(value):
        return {"type": "bool_assign", "value": False, "kills_guard": True}
    if is_literal_true(value):
        return {"type": "bool_assign", "value": True, "kills_guard": False}

    # Unary: flag <- not flag
    if t == "unary":
        uop = value.get("operator", "")
        arg = value.get("arg", {})
        if (
            uop.lower() == "not"
            and isinstance(arg, dict)
            and arg.get("type", "").lower() == "identifier"
        ):
            if arg.get("name", "") == var_name:
                return {"type": "toggle", "monotone": False}

    # Euclid: var <- expr MOD var (a mod b < b cuando b > 0 → var disminuye)
    if t == "binary" and (op == "mod" or op == "MOD"):
        left = value.get("left", {})
        right = value.get("right", {})
        if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
            if right.get("name", "") == var_name:
                other = expr_to_str(left) if left else "?"
                return {"type": "mod_decrease", "other_var": other, "monotone": True}

    # Binary: i <- i + c, i - c, i * c, i / c
    if t == "binary" and op in ("+", "-", "*", "/", "//", "div"):
        left = value.get("left", {})
        right = value.get("right", {})

        if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
            if left.get("name", "") == var_name:
                const = expr_to_str(right)
                if is_simple_constant(const):
                    if op == "+":
                        return {
                            "type": "num",
                            "operator": "+",
                            "constant": const,
                            "monotone": True,
                        }
                    if op == "-":
                        return {
                            "type": "num",
                            "operator": "-",
                            "constant": const,
                            "monotone": True,
                        }
                    if op in ("*", "/", "//", "div"):
                        return {
                            "type": "num",
                            "operator": op,
                            "constant": const,
                            "monotone": True,
                        }
        if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
            if right.get("name", "") == var_name and op in ("+", "*"):
                const = expr_to_str(left)
                if is_simple_constant(const):
                    return {
                        "type": "num",
                        "operator": op,
                        "constant": const,
                        "monotone": True,
                    }

    # Reset: i <- 0, i <- n (asignación a constante u otra expr)
    if t in ("number", "literal"):
        return {"type": "reset", "monotone": False}
    if t == "identifier":
        return {"type": "reset", "monotone": False}

    return None


def _collect_assignments(node: Any, var_name: str, out: List[Dict[str, Any]]) -> None:
    """Recorre y colecta asignaciones a var_name. No entra en while/for/repeat anidados."""
    if not isinstance(node, dict):
        return
    nt = node.get("type", "").lower()
    if nt == "assign":
        target = node.get("target", {})
        if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
            if target.get("name", "") == var_name:
                parsed = _parse_update(node.get("value"), var_name)
                if parsed:
                    out.append({**parsed, "node": node})
    if nt == "block":
        for stmt in node.get("body", []):
            _collect_assignments(stmt, var_name, out)
    elif nt == "if":
        for branch in [node.get("consequent"), node.get("alternate")]:
            if branch:
                body = (
                    branch.get("body", [])
                    if branch.get("type", "").lower() == "block"
                    else [branch]
                )
                for stmt in body:
                    _collect_assignments(stmt, var_name, out)
    elif nt not in ("while", "repeat", "for"):
        for key in ["body", "consequent", "alternate", "value", "left", "right", "arg"]:
            if key in node:
                child = node[key]
                if isinstance(child, dict):
                    _collect_assignments(child, var_name, out)
                elif isinstance(child, list):
                    for item in child:
                        if isinstance(item, dict):
                            _collect_assignments(item, var_name, out)


def _updates_match(a: Dict, b: Dict) -> bool:
    """True si dos updates son equivalentes para must/may."""
    if a.get("type") != b.get("type"):
        return False
    if a.get("type") == "num":
        return a.get("operator") == b.get("operator") and a.get("constant") == b.get("constant")
    if a.get("type") == "bool_assign":
        return a.get("value") == b.get("value")
    if a.get("type") == "mod_decrease":
        return a.get("other_var") == b.get("other_var")
    return True


def _must_may_if(node: Any, var_name: str) -> tuple[List[Dict], List[Dict]]:
    """
    IF cond then A else B: must = must(A) ∩ must(B), may = may(A) ∪ may(B) ∪ must(A) ∪ must(B)
    IF sin else: must = ∅, may = may(then) ∪ must(then)
    """
    then_branch = node.get("consequent") or node.get("then")
    else_branch = node.get("alternate")

    must_t, may_t = _must_may_stmt(then_branch, var_name) if then_branch else ([], [])
    if not else_branch:
        return [], list({id(x): x for x in may_t + must_t}.values())

    must_e, may_e = _must_may_stmt(else_branch, var_name)
    must_common = [a for a in must_t if any(_updates_match(a, b) for b in must_e)]
    may_all = may_t + may_e + must_t + must_e
    may_dedup = list({id(x): x for x in may_all}.values())
    return must_common, may_dedup


def _must_may_stmt(node: Any, var_name: str) -> tuple[List[Dict], List[Dict]]:
    """
    Calcula must y may para un statement.
    Secuencia: todos los stmt se ejecutan, must = todos los updates.
    IF sin else: must = ∅, may = updates en then.
    IF con else: must = intersección de ambas ramas.
    """
    if not isinstance(node, dict):
        return [], []
    nt = node.get("type", "").lower()
    if nt == "block":
        must_all: List[Dict] = []
        may_all: List[Dict] = []
        for stmt in node.get("body", []):
            m, y = _must_may_stmt(stmt, var_name)
            must_all.extend(m)
            may_all.extend(y)
        return must_all, list({id(x): x for x in may_all}.values())
    if nt == "if":
        return _must_may_if(node, var_name)
    if nt == "for":
        # Todo dentro de un FOR se considera may update desde la perspectiva del WHILE:
        # el rango puede ser vacío (0 iteraciones) o la rama condicional interna puede no ejecutarse.
        _, may_nested = _must_may_stmt(node.get("body", {}), var_name)
        return [], may_nested
    if nt in ("while", "repeat"):
        # Todo dentro de un bucle anidado se considera may update (ya que podría ejecutarse 0 veces)
        _, may_nested = _must_may_stmt(node.get("body", {}), var_name)
        # También extraer del bloque interno directamente por si no es un "block" Node
        return [], may_nested

    if nt == "assign":
        target = node.get("target", {})
        if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
            if target.get("name", "") == var_name:
                parsed = _parse_update(node.get("value"), var_name)
                if parsed:
                    return [parsed], [parsed]

    return [], []


def _compute_summary_for_var(
    body: Any,
    var_name: str,
    guard_desired: Optional[bool],
) -> VarUpdateSummary:
    """
    Calcula VarUpdateSummary para una variable.
    guard_desired: True si el guard exige var==true para continuar;
                   False si exige var==false (ej. ordenado=false en bubble sort mejorado).
    """
    must, may = _must_may_stmt(body, var_name)
    kills_guard_must = False
    revives_guard_may = False
    monotone_progress_must = False

    for u in must:
        if u.get("type") == "bool_assign":
            if u.get("value") is False and guard_desired is True:
                kills_guard_must = True  # var=true → var<-false mata
            elif u.get("value") is True and guard_desired is False:
                kills_guard_must = True  # var=false → var<-true mata (bubble sort mejorado)
        if (u.get("type") == "num" or u.get("type") == "mod_decrease") and u.get("monotone"):
            monotone_progress_must = True

    for u in may:
        if u.get("type") == "bool_assign":
            if u.get("value") is True and guard_desired is True:
                revives_guard_may = True
            elif u.get("value") is False and guard_desired is False:
                revives_guard_may = True

    return VarUpdateSummary(
        must_updates=must,
        may_updates=may,
        kills_guard_must=kills_guard_must,
        revives_guard_may=revives_guard_may,
        monotone_progress_must=monotone_progress_must,
    )


def summarize_updates(
    body: Any,
    vars_used: Set[str],
    guard_info: Any,
    parent_context: Optional[Dict] = None,
) -> Dict[str, VarUpdateSummary]:
    """
    Calcula UpdateSummary por cada variable usada en el guard.

    Args:
        body: Cuerpo del WHILE (Block o statement)
        vars_used: Variables del guard
        guard_info: GuardInfo para saber bool_var y desired
        parent_context: Contexto padre (opcional, para valor inicial)

    Returns:
        Dict[variable_name, VarUpdateSummary]

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # Normalizar cuerpo como bloque si el parser devuelve una lista de sentencias
    if isinstance(body, list):
        body = {"type": "block", "body": body}
    result: Dict[str, VarUpdateSummary] = {}
    for var_name in vars_used:
        if not var_name:
            continue

        # Determinar si esta variable es la que controla el bucle como booleano
        desired = None
        if guard_info:
            if getattr(guard_info, "bool_var", None) == var_name:
                desired = getattr(guard_info, "desired", True)
            else:
                # Si el guard está compuesto (AND/OR) puede contener comparaciones explícitas
                # del tipo flag == true/false. En ese caso, respetar el desired real.
                atoms = getattr(guard_info, "atoms", None) or []
                for atom in atoms:
                    if not isinstance(atom, dict):
                        continue
                    if atom.get("var") == var_name and atom.get("bool_desired") is not None:
                        desired = bool(atom.get("bool_desired"))
                        break

                # Si aparece como identificador suelto dentro de AND/OR, entonces el guard exige True.
                if desired is None:
                    if hasattr(guard_info, "and_bool_vars") and var_name in getattr(
                        guard_info, "and_bool_vars", set()
                    ):
                        desired = True
                    elif hasattr(guard_info, "or_bool_vars") and var_name in getattr(
                        guard_info, "or_bool_vars", set()
                    ):
                        desired = True

        result[var_name] = _compute_summary_for_var(body, var_name, desired)
    return result
