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
    and_bool_vars: Set[str] = field(default_factory=set)  # Vars que son bool en disyuntos de AND


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


def _is_literal_true(node: Dict[str, Any]) -> bool:
    """True si expr es literal True (Literal, Number o Identifier 'true')."""
    if not node: return False
    if node.get("type", "").lower() == "literal":
        val = node.get("value")
        if isinstance(val, bool): return val is True
        if isinstance(val, str):
            return val.lower().strip() in ("true", "verdadero", "verdad", "v")
    # Parser puede producir Identifier name="VERDADERO"
    if node.get("type", "").lower() == "identifier":
        return node.get("name", "").lower() in ("true", "verdadero", "verdad", "v")
    return False


def _is_literal_false(node: Dict[str, Any]) -> bool:
    """True si expr es literal False (Literal, Number o Identifier 'false')."""
    if not node: return False
    if node.get("type", "").lower() == "literal":
        val = node.get("value")
        if isinstance(val, bool): return val is False
        if isinstance(val, str):
            return val.lower().strip() in ("false", "falso", "f")
    # Parser puede producir Identifier name="false" para constantes booleanas
    if node.get("type", "").lower() == "identifier":
        return node.get("name", "").lower() in ("false", "f", "falso")
    return False


def _collect_bool_vars(expr: Any) -> Set[str]:
    """Recolecta variables que actúan como bool (identifier o var==true/false)."""
    out: Set[str] = set()
    if not isinstance(expr, dict):
        return out
    et = expr.get("type", "").lower()
    op = (expr.get("op") or expr.get("operator") or "").lower()
    if et == "identifier":
        # Considerar cualquier identificador “suelto” dentro del guard como candidato a flag booleano.
        # Esto permite detectar patrones como (i < n AND intercambiado) sin exigir intercambiado==VERDADERO.
        name = expr.get("name", "")
        if name:
            out.add(name)
        return out
    if et == "binary":
        left = expr.get("left")
        right = expr.get("right")
        # CASO: bool == true, bool != false, etc.
        if op in ("==", "!=", "="):
            if _is_literal_true(right) or _is_literal_false(right):
                if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                    print(f"DEBUG COLLECT BOOL: found {left.get('name')}")
                    out.add(left.get("name", ""))
            elif _is_literal_true(left) or _is_literal_false(left):
                if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                    print(f"DEBUG COLLECT BOOL: found {right.get('name')}")
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
            return GuardInfo(kind="bool_var", bool_var=test.get("name"), desired=True, vars_used={test.get("name")}, has_array_access=has_array[0])
        elif expr_type == "binary":
            op = (test.get("op") or test.get("operator") or "").lower()
            if op in ("=", "=="):
                l = test.get("left", {})
                r = test.get("right", {})
                if isinstance(l, dict) and l.get("type", "").lower() == "identifier":
                    if _is_literal_true(r): return GuardInfo(kind="bool_var", bool_var=l.get("name"), desired=True, vars_used={l.get("name")})
                    if _is_literal_false(r): return GuardInfo(kind="bool_var", bool_var=l.get("name"), desired=False, vars_used={l.get("name")})

    return GuardInfo(
        kind=kind if kind in ("and", "or", "not", "rel", "bool_var") else "unknown",
        vars_used=vars_used,
        atoms=atoms,
        has_array_access=has_array[0],
        or_bool_vars=or_bools,
        and_bool_vars=and_bools
    )
