"""
Análisis de guards (condiciones) de bucles WHILE.

Representación normalizada del guard completo, no solo la primera subcondición.
Soporta const, bool_var, rel, and, or, not y normalización de relacionales.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Set

from ..ir.expr_utils import expr_to_str
from ..ir.expr_utils import is_literal_false as _is_literal_false
from ..ir.expr_utils import is_literal_true as _is_literal_true


@dataclass
class GuardInfo:
    """
    Información normalizada del guard de un WHILE.

    Attributes:
        kind: Tipo de guard (const, bool_var, rel, and, or, not, unknown)
        vars_used: Variables (identificadores) usadas en el guard
        atoms: Lista de átomos relacionales normalizados {var, limit, op}
        has_array_access: True si hay acceso a array (A[i], etc.)
        const_value: True/False si el guard es literal constante
        bool_var: Nombre de variable si guard es identifier o id==true/false
        desired: True si bool_var debe ser true para continuar (para id==true)
    """

    kind: Literal["const", "bool_var", "rel", "and", "or", "not", "unknown"]
    vars_used: Set[str] = field(default_factory=set)
    atoms: List[Dict[str, Any]] = field(default_factory=list)
    has_array_access: bool = False
    const_value: Optional[bool] = None
    bool_var: Optional[str] = None
    desired: Optional[bool] = None  # True = guard exige var==true para continuar
    or_bool_vars: Set[str] = field(default_factory=set)  # Vars que son bool en disyuntos de OR
    and_bool_vars: Set[str] = field(default_factory=set)  # Vars que son bool en disyuntos de AND


def _collect_bool_vars(expr: Any) -> Set[str]:
    """Recolecta variables que actúan como bool (identifier o var==true/false).

    Importante: NO recolectar identificadores que aparezcan dentro de comparaciones numéricas
    (ej. i < n), porque eso termina tratando variables de control como flags booleanos.
    """
    out: Set[str] = set()
    if not isinstance(expr, dict):
        return out
    et = expr.get("type", "").lower()
    op = (expr.get("op") or expr.get("operator") or "").lower()
    if et == "identifier":
        # Considerar cualquier identificador "suelto" dentro del guard como candidato a flag booleano.
        # Esto permite detectar patrones como (i < n AND intercambiado) sin exigir intercambiado==VERDADERO.
        name = expr.get("name", "")
        if name:
            out.add(name)
        return out
    if et == "binary":
        left = expr.get("left")
        right = expr.get("right")
        # Si es una comparación numérica (relacional), no descender: evita recolectar i/n como bool vars.
        if op in (
            "<",
            "<=",
            ">",
            ">=",
        ):
            return out
        # CASO: bool == true, bool != false, etc.
        if op in ("==", "!=", "="):
            if _is_literal_true(right) or _is_literal_false(right):
                if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                    out.add(left.get("name", ""))
            elif _is_literal_true(left) or _is_literal_false(left):
                if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                    out.add(right.get("name", ""))
        else:
            # Recursión para AND/OR
            out.update(_collect_bool_vars(left))
            out.update(_collect_bool_vars(right))
    return out


def _collect_vars_and_array(expr: Any, vars_used: Set[str], has_array: List[bool]) -> None:
    """Recorre expr y acumula vars_used y si hay array."""
    if not isinstance(expr, dict):
        return
    t = expr.get("type", "").lower()
    if t == "identifier":
        vars_used.add(expr.get("name", ""))
    elif t == "index":
        has_array[0] = True
        _collect_vars_and_array(expr.get("target"), vars_used, has_array)
        _collect_vars_and_array(expr.get("index"), vars_used, has_array)
    elif t == "binary":
        _collect_vars_and_array(expr.get("left"), vars_used, has_array)
        _collect_vars_and_array(expr.get("right"), vars_used, has_array)
    elif t == "unary":
        _collect_vars_and_array(expr.get("arg"), vars_used, has_array)
    for key in ("target", "index", "left", "right", "arg"):
        if key in expr:
            _collect_vars_and_array(expr[key], vars_used, has_array)


def _normalize_relational(left: Dict, right: Dict, op: str) -> Optional[Dict[str, Any]]:
    """
    Normaliza relacional: n > i -> i < n; i == true -> bool_var.
    Retorna {var, limit, op} o {var, bool_desired: True/False}.
    """
    left_is_var = isinstance(left, dict) and left.get("type", "").lower() == "identifier"
    right_is_var = isinstance(right, dict) and right.get("type", "").lower() == "identifier"

    # i == true / i == false
    if left_is_var and _is_literal_true(right):
        return {"var": left.get("name", ""), "bool_desired": True}
    if left_is_var and _is_literal_false(right):
        return {"var": left.get("name", ""), "bool_desired": False}
    if right_is_var and _is_literal_true(left):
        return {"var": right.get("name", ""), "bool_desired": True}
    if right_is_var and _is_literal_false(left):
        return {"var": right.get("name", ""), "bool_desired": False}

    # Relacionales numéricos
    op_map = {">": "<", ">=": "<=", "<": ">", "<=": ">="}
    if left_is_var and not right_is_var:
        var_name = left.get("name", "")
        limit = expr_to_str(right)
        return {"var": var_name, "limit": limit, "op": op}
    if right_is_var and not left_is_var:
        var_name = right.get("name", "")
        limit = expr_to_str(left)
        op_norm = op_map.get(op, op)
        return {"var": var_name, "limit": limit, "op": op_norm}
    if left_is_var and right_is_var:
        var_name = left.get("name", "")
        limit = right.get("name", "")
        return {"var": var_name, "limit": limit, "op": op, "two_vars": True}
    return None


def _analyze_guard_rec(
    test: Any, atoms: List[Dict], vars_used: Set[str], has_array: List[bool]
) -> Optional[str]:
    """
    Analiza recursivamente el guard. Retorna kind o None si unknown.
    Acumula atoms, vars_used, has_array.
    """
    if not isinstance(test, dict):
        return "unknown"

    expr_type = test.get("type", "").lower()
    op = (test.get("op") or test.get("operator") or "").lower()

    # Literal constante
    if expr_type in ("literal", "number"):
        v = test.get("value")
        if _is_literal_true(test) or (v is True):
            return "const"
        if _is_literal_false(test) or (v is False):
            return "const"
        return "unknown"

    # Identifier solo (guard es variable booleana)
    if expr_type == "identifier":
        vars_used.add(test.get("name", ""))
        return "bool_var"

    # Binary
    if expr_type == "binary":
        left = test.get("left", {})
        right = test.get("right", {})

        if op in ("and", "&&"):
            _collect_vars_and_array(left, vars_used, has_array)
            _collect_vars_and_array(right, vars_used, has_array)
            _analyze_guard_rec(left, atoms, vars_used, has_array)
            _analyze_guard_rec(right, atoms, vars_used, has_array)
            return "and"

        if op in ("or", "||"):
            _collect_vars_and_array(left, vars_used, has_array)
            _collect_vars_and_array(right, vars_used, has_array)
            _analyze_guard_rec(left, atoms, vars_used, has_array)
            _analyze_guard_rec(right, atoms, vars_used, has_array)
            return "or"

        if op in ("<", "<=", ">", ">=", "=", "==", "<>", "!="):
            _collect_vars_and_array(left, vars_used, has_array)
            _collect_vars_and_array(right, vars_used, has_array)
            atom = _normalize_relational(left, right, op)
            if atom:
                atoms.append(atom)
            return "rel"

    # Unary NOT
    if expr_type == "unary":
        uop = (test.get("operator") or test.get("op") or "").lower()
        if uop == "not":
            _collect_vars_and_array(test.get("arg"), vars_used, has_array)
            _analyze_guard_rec(test.get("arg"), atoms, vars_used, has_array)
            return "not"

    return "unknown"


def analyze_guard(test: Any) -> GuardInfo:
    """
    Analiza el guard completo del WHILE y retorna GuardInfo.
    """
    vars_used: Set[str] = set()
    atoms: List[Dict[str, Any]] = []
    has_array: List[bool] = [False]

    if not isinstance(test, dict):
        return GuardInfo(kind="unknown", vars_used=vars_used, atoms=atoms)

    expr_type = test.get("type", "").lower()

    # Literal constante
    if expr_type in ("literal", "number"):
        v = test.get("value")
        if _is_literal_true(test) or v is True:
            return GuardInfo(kind="const", vars_used=set(), atoms=[], const_value=True)
        if _is_literal_false(test) or v is False:
            return GuardInfo(kind="const", vars_used=set(), atoms=[], const_value=False)

    # Identificar clase de guard recursivamente
    kind = _analyze_guard_rec(test, atoms, vars_used, has_array)

    or_bools = set()
    and_bools = set()
    if kind == "or":
        or_bools = _collect_bool_vars(test)
    elif kind == "and":
        and_bools = _collect_bool_vars(test)
    elif kind == "bool_var" or (kind == "rel" and test.get("op", "") in ("=", "==")):
        # Caso especial: single variable booleana o var=literall_bool
        # Ya que _analyze_guard_rec puede retornar rel para var=true
        if expr_type == "identifier":
            return GuardInfo(
                kind="bool_var",
                bool_var=test.get("name"),
                desired=True,
                vars_used={test.get("name")},
                has_array_access=has_array[0],
            )
        elif expr_type == "binary":
            op = (test.get("op") or test.get("operator") or "").lower()
            if op in ("=", "=="):
                left_expr = test.get("left", {})
                right_expr = test.get("right", {})
                if (
                    isinstance(left_expr, dict)
                    and left_expr.get("type", "").lower() == "identifier"
                ):
                    var_name = left_expr.get("name")
                    if _is_literal_true(right_expr):
                        return GuardInfo(
                            kind="bool_var",
                            bool_var=var_name,
                            desired=True,
                            vars_used={var_name},
                        )
                    if _is_literal_false(right_expr):
                        return GuardInfo(
                            kind="bool_var",
                            bool_var=var_name,
                            desired=False,
                            vars_used={var_name},
                        )

    return GuardInfo(
        kind=kind if kind in ("and", "or", "not", "rel", "bool_var") else "unknown",
        vars_used=vars_used,
        atoms=atoms,
        has_array_access=has_array[0],
        or_bool_vars=or_bools,
        and_bool_vars=and_bools,
    )
