"""
Análisis de guards (condiciones) de bucles WHILE.

Representación normalizada del guard completo, no solo la primera subcondición.
Soporta const, bool_var, rel, and, or, not y normalización de relacionales.

Author: Juan Camilo Cruz Parra (@Cruz1122)
Version: 0.1.0
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Set


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


def _expr_to_str(expr: Any) -> str:
    """Convierte expresión del AST a string."""
    if expr is None:
        return ""
    if isinstance(expr, str):
        return expr
    if isinstance(expr, (int, float)):
        return str(expr)
    if isinstance(expr, dict):
        expr_type = expr.get("type", "").lower()
        if expr_type == "identifier":
            return expr.get("name", "unknown")
        if expr_type in ("number", "literal"):
            return str(expr.get("value", "0"))
        if expr_type == "binary":
            left = _expr_to_str(expr.get("left", ""))
            right = _expr_to_str(expr.get("right", ""))
            op = expr.get("op", "") or expr.get("operator", "")
            return f"({left}) {op} ({right})"
        if expr_type == "index":
            target = _expr_to_str(expr.get("target", ""))
            index = _expr_to_str(expr.get("index", ""))
            return f"{target}[{index}]"
        if expr_type == "unary":
            arg = _expr_to_str(expr.get("arg", ""))
            op = expr.get("operator", "")
            return f"{op}({arg})"
        return str(expr.get("value", str(expr)))
    return str(expr)


def _is_literal_true(expr: Any) -> bool:
    """True si expr es literal True (Literal, Number o Identifier 'true')."""
    if isinstance(expr, dict):
        t = expr.get("type", "").lower()
        v = expr.get("value")
        if t in ("literal", "number") and (v is True or v == "true" or v == "T"):
            return True
        # Parser puede producir Identifier name="true" para constantes booleanas
        if t == "identifier" and (expr.get("name", "").lower() in ("true", "t")):
            return True
    return False


def _is_literal_false(expr: Any) -> bool:
    """True si expr es literal False (Literal, Number o Identifier 'false')."""
    if isinstance(expr, dict):
        t = expr.get("type", "").lower()
        v = expr.get("value")
        if t in ("literal", "number") and (v is False or v == "false" or v == "F"):
            return True
        # Parser puede producir Identifier name="false" para constantes booleanas
        if t == "identifier" and (expr.get("name", "").lower() in ("false", "f")):
            return True
    return False


def _collect_or_bool_vars(expr: Any) -> Set[str]:
    """Recolecta variables que actúan como bool en disyuntos de OR (identifier o var==true/false)."""
    out: Set[str] = set()
    if not isinstance(expr, dict):
        return out
    t = expr.get("type", "").lower()
    op = (expr.get("op") or expr.get("operator") or "").lower()
    if t == "identifier":
        out.add(expr.get("name", ""))
        return out
    if t == "binary":
        left, right = expr.get("left", {}), expr.get("right", {})
        if op in ("=", "=="):
            if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                if _is_literal_true(right) or _is_literal_false(right):
                    out.add(left.get("name", ""))
                    return out
            if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                if _is_literal_true(left) or _is_literal_false(left):
                    out.add(right.get("name", ""))
                    return out
        if op in ("or", "||"):
            out.update(_collect_or_bool_vars(left))
            out.update(_collect_or_bool_vars(right))
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
        limit = _expr_to_str(right)
        return {"var": var_name, "limit": limit, "op": op}
    if right_is_var and not left_is_var:
        var_name = right.get("name", "")
        limit = _expr_to_str(left)
        op_norm = op_map.get(op, op)
        return {"var": var_name, "limit": limit, "op": op_norm}
    if left_is_var and right_is_var:
        var_name = left.get("name", "")
        limit = right.get("name", "")
        return {"var": var_name, "limit": limit, "op": op, "two_vars": True}
    return None


def _analyze_guard_rec(test: Any, atoms: List[Dict], vars_used: Set[str], has_array: List[bool]) -> Optional[str]:
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
            k1 = _analyze_guard_rec(left, atoms, vars_used, has_array)
            k2 = _analyze_guard_rec(right, atoms, vars_used, has_array)
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

    Recorre el árbol completo, no solo la primera subcondición.
    Normaliza: n > i -> i < n; i == true -> bool_var con desired=True.

    Args:
        test: Nodo de la condición (expr) del AST

    Returns:
        GuardInfo con kind, vars_used, atoms, etc.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    vars_used: Set[str] = set()
    atoms: List[Dict[str, Any]] = []
    has_array: List[bool] = [False]

    if not isinstance(test, dict):
        return GuardInfo(kind="unknown", vars_used=vars_used, atoms=atoms)

    expr_type = test.get("type", "").lower()
    const_value = None
    bool_var = None
    desired = None

    # Literal constante
    if expr_type in ("literal", "number"):
        v = test.get("value")
        if _is_literal_true(test) or v is True:
            return GuardInfo(
                kind="const",
                vars_used=set(),
                atoms=[],
                has_array_access=False,
                const_value=True,
            )
        if _is_literal_false(test) or v is False:
            return GuardInfo(
                kind="const",
                vars_used=set(),
                atoms=[],
                has_array_access=False,
                const_value=False,
            )

    # Identifier
    if expr_type == "identifier":
        name = test.get("name", "")
        vars_used.add(name)
        return GuardInfo(
            kind="bool_var",
            vars_used=vars_used,
            atoms=[],
            has_array_access=False,
            bool_var=name,
            desired=True,
        )

    # Binary
    if expr_type == "binary":
        op = (test.get("op") or test.get("operator") or "").lower()
        left = test.get("left", {})
        right = test.get("right", {})

        # i == true / i == false
        if op in ("=", "=="):
            if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                var_name = left.get("name", "")
                if _is_literal_true(right):
                    vars_used.add(var_name)
                    return GuardInfo(
                        kind="bool_var",
                        vars_used=vars_used,
                        atoms=[],
                        has_array_access=False,
                        bool_var=var_name,
                        desired=True,
                    )
                if _is_literal_false(right):
                    vars_used.add(var_name)
                    return GuardInfo(
                        kind="bool_var",
                        vars_used=vars_used,
                        atoms=[],
                        has_array_access=False,
                        bool_var=var_name,
                        desired=False,
                    )
            if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                var_name = right.get("name", "")
                if _is_literal_true(left):
                    vars_used.add(var_name)
                    return GuardInfo(
                        kind="bool_var",
                        vars_used=vars_used,
                        atoms=[],
                        has_array_access=False,
                        bool_var=var_name,
                        desired=True,
                    )
                if _is_literal_false(left):
                    vars_used.add(var_name)
                    return GuardInfo(
                        kind="bool_var",
                        vars_used=vars_used,
                        atoms=[],
                        has_array_access=False,
                        bool_var=var_name,
                        desired=False,
                    )

        # Relacional
        if op in ("<", "<=", ">", ">=", "<>", "!="):
            atom = _normalize_relational(left, right, op)
            if atom:
                atoms.append(atom)
                if "var" in atom:
                    vars_used.add(atom["var"])
                if "limit" in atom and isinstance(atom["limit"], str) and atom["limit"] not in ("true", "false"):
                    pass
            _collect_vars_and_array(left, vars_used, has_array)
            _collect_vars_and_array(right, vars_used, has_array)
            return GuardInfo(
                kind="rel",
                vars_used=vars_used,
                atoms=atoms,
                has_array_access=has_array[0],
            )

        # AND / OR
        kind = _analyze_guard_rec(test, atoms, vars_used, has_array)
        or_bool_vars: Set[str] = set()
        if kind == "or":
            or_bool_vars = _collect_or_bool_vars(left) | _collect_or_bool_vars(right)
        return GuardInfo(
            kind=kind if kind in ("and", "or", "not") else "unknown",
            vars_used=vars_used,
            atoms=atoms,
            has_array_access=has_array[0],
            or_bool_vars=or_bool_vars,
        )

    kind = _analyze_guard_rec(test, atoms, vars_used, has_array)
    return GuardInfo(
        kind=kind if kind else "unknown",
        vars_used=vars_used,
        atoms=atoms,
        has_array_access=has_array[0],
    )
