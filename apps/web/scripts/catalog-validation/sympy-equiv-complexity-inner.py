#!/usr/bin/env python3
"""
Helper para validación de complejidad:
Comprueba equivalencia simbólica (o, para exponenciales tipo r^n, cercanía numérica del dominant base)
entre dos expresiones "inner" (sin O/Θ/Ω envolvente).

Entrada:
  argv[1] = expected_inner
  argv[2] = obtained_inner

Salida:
  stdout: "true" | "false"
"""

from __future__ import annotations

import re
import sys
from typing import Optional


def _clean_latex(s: str) -> str:
    s = s.strip()
    # Quitar delimitadores y paréntesis LaTeX.
    s = re.sub(r"^\$+", "", s)
    s = re.sub(r"\$+$", "", s)
    s = s.replace(r"\left", "").replace(r"\right", "")
    # Normalizar multiplicación.
    s = s.replace(r"\cdot", "*").replace(r"\times", "*")
    return s


def _contains_unresolved_symbols(s: str) -> bool:
    sl = s
    return (
        "I_{while" in sl
        or "i_{while" in sl
        or "t_{while" in sl
        or "t_{" in sl
        and "while" in sl
        or "\\infty" in sl
        or "infty" in sl.lower()
    )


def _parse_expr_latex(expr: str):
    # Import local para no penalizar imports en rutas que no se usan.
    from sympy import sqrt

    expr = _clean_latex(expr)
    if not expr:
        return None

    if _contains_unresolved_symbols(expr):
        return None

    # En lugar de parsear LaTeX completo (requiere antlr4), intentamos cubrir
    # el subconjunto que aparece en el catálogo para exponenciales:
    #   - fracciones: \frac{a}{b}
    #   - raíces: \sqrt{c}, \sqrt[3]{c}
    #   - sumas/restas y multiplicación implícita ya convertida en *_clean_latex
    #
    # Para esto, devolvemos una expresión SymPy numéricamente evaluable
    # cuando sea posible. Si no, None.
    phi_const = (1 + sqrt(5)) / 2

    try:
        sympy_expr = _latex_subset_to_sympy_expr(expr, phi_const=phi_const)
        return sympy_expr
    except Exception:
        return None


def _strip_outer_parens(s: str) -> str:
    s = s.strip()
    if s.startswith("(") and s.endswith(")"):
        # Solo remover si los paréntesis envuelven toda la cadena de forma balanceada.
        depth = 0
        for i, ch in enumerate(s):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0 and i != len(s) - 1:
                    return s
        return s[1:-1].strip()
    return s


def _extract_base_pow_n(inner: str) -> Optional[str]:
    s = inner.strip()
    # Casos típicos:
    #   (\cdots)^n
    #   (\cdots)^{n}
    #   \varphi^n
    if s.endswith("^n"):
        return s[: -len("^n")].strip()
    if s.endswith("^{n}"):
        return s[: -len("^{n}")].strip()
    if s.endswith("^{n} "):
        return s[: -len("^{n} ")].strip()
    return None


def _is_pow_with_n_str(expr: str) -> bool:
    return _extract_base_pow_n(expr) is not None


def _parse_int_or_float(s: str) -> Optional[float]:
    try:
        return float(s)
    except Exception:
        return None


def _latex_group(s: str, start: int) -> tuple[str, int]:
    """
    Parsea un grupo LaTeX delimitado por llaves: s[start] == '{'
    Devuelve (contenido, end_index_after_closing_brace)
    """
    if start >= len(s) or s[start] != "{":
        raise ValueError("expected '{' at start")
    depth = 0
    i = start
    for i in range(start, len(s)):
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
            if depth == 0:
                # i es la '}' de cierre
                return s[start + 1 : i], i + 1
    raise ValueError("unbalanced braces")


def _latex_subset_to_sympy_expr(latex: str, *, phi_const):
    """
    Convierte un subconjunto de LaTeX a una expresión evaluable por sympy.
    """
    from sympy import sympify

    s = latex.strip()
    if not s:
        raise ValueError("empty")

    # Quitar paréntesis LaTeX extra; conservamos llaves `{...}` para
    # poder parsear macros como `\\frac{...}{...}` y `\\sqrt{...}`.
    s = s.replace("\\left", "").replace("\\right", "")

    # Reemplazar constantes
    s = s.replace("\\varphi", "(1+sqrt(5))/2")
    s = s.replace("\\phi", "(1+sqrt(5))/2")

    # Eliminar espacios para que sympify sea más estable
    s = re.sub(r"\s+", "", s)

    # A veces el LaTeX trae multiplicación implícita tipo `3 \sqrt{...}`
    # (sin `\cdot`). SymPy no entiende esa forma, así que insertamos `*`
    # entre un número y un macro que empieza con `\...`.
    s = re.sub(r"(\d)(\\[a-zA-Z])", r"\1*\2", s)
    s = re.sub(r"(\))(\s*)(\\[a-zA-Z])", r"\1*\3", s)

    # Convertir \sqrt[<k>]{...} y \sqrt{...} usando un escáner con brace parsing.
    out = []
    i = 0
    while i < len(s):
        if s.startswith("\\sqrt[", i):
            # parse k
            j = i + len("\\sqrt[")
            k_end = s.find("]", j)
            if k_end == -1:
                raise ValueError("bad sqrt[...]{...} form")
            k_str = s[j:k_end]
            k_val = _parse_int_or_float(k_str)
            if k_val is None:
                raise ValueError("sqrt root index not numeric")
            if k_end + 1 >= len(s) or s[k_end + 1] != "{":
                raise ValueError("bad sqrt[...]{...} missing group")
            group, end = _latex_group(s, k_end + 1)
            group_expr = _latex_subset_to_sympy_expr(group, phi_const=phi_const)
            out.append(f"(({group_expr}))**(1/({k_val}))")
            i = end
            continue

        if s.startswith("\\sqrt", i):
            # Forma \sqrt{...} (ya convertimos llaves a paréntesis, pero sigue apareciendo \sqrt{...})
            j = i + len("\\sqrt")
            if j >= len(s) or s[j] != "{":
                raise ValueError("bad \\sqrt{...} form")
            group, end = _latex_group(s, j)
            group_expr = _latex_subset_to_sympy_expr(group, phi_const=phi_const)
            out.append(f"(sqrt(({group_expr})))")
            i = end
            continue

        if s.startswith("\\frac{", i):
            # Parse \frac{a}{b}
            a_start = i + len("\\frac")
            # a_start points at '{'
            a_group, a_end = _latex_group(s, a_start)
            if a_end >= len(s) or s[a_end] != "{":
                raise ValueError("bad \\frac second group")
            b_group, b_end = _latex_group(s, a_end)
            a_expr = _latex_subset_to_sympy_expr(a_group, phi_const=phi_const)
            b_expr = _latex_subset_to_sympy_expr(b_group, phi_const=phi_const)
            out.append(f"(({a_expr})/({b_expr}))")
            i = b_end
            continue

        # Normalizar exponent power caret in base strings si aparece
        if s[i] == "^":
            out.append("**")
            i += 1
            continue

        out.append(s[i])
        i += 1

    return sympify("".join(out))


def _approx_rel_close(a: float, b: float, rel_tol: float = 1e-3) -> bool:
    if a == 0 and b == 0:
        return True
    if a == 0 or b == 0:
        return False
    return abs(a - b) / abs(a) <= rel_tol


def equivalent(expected_inner: str, obtained_inner: str) -> bool:
    exp = expected_inner
    got = obtained_inner

    if _contains_unresolved_symbols(exp) or _contains_unresolved_symbols(got):
        return False

    e = _parse_expr_latex(exp)
    o = _parse_expr_latex(got)
    if e is None or o is None:
        return False

    from sympy import simplify

    # 1) Exponenciales base^n: comparar dominant base numéricamente.
    #    (Es el caso que más ensucia el reporte: phi root forms, tribonacci-like,
    #     y familias con raíces cerradas vs decimales.)
    try:
        base_e_latex = _extract_base_pow_n(expected_inner)
        base_o_latex = _extract_base_pow_n(obtained_inner)
        if base_e_latex is not None and base_o_latex is not None:
            base_e_expr = _parse_base_to_sympy(base_e_latex)
            base_o_expr = _parse_base_to_sympy(base_o_latex)
            val_e = float(base_e_expr.evalf(50))
            val_o = float(base_o_expr.evalf(50))
            return _approx_rel_close(val_e, val_o, rel_tol=5e-3)
    except Exception:
        pass

    # 2) Fallback: si sympify nos dio expresiones, intentamos igualdad simbólica.
    # `simplify` puede bloquear SymPy en expresiones enormes (p. ej. raíces de recurrencias altas).
    try:
        from sympy import count_ops

        if int(count_ops(e)) + int(count_ops(o)) > 250:
            return False
    except Exception:
        pass
    try:
        diff = simplify(e - o)
        if diff == 0:
            return True
    except Exception:
        return False

    return False


def _parse_base_to_sympy(base_latex: str):
    from sympy import sqrt

    phi_const = (1 + sqrt(5)) / 2
    base_latex = base_latex.strip()
    base_latex = base_latex.replace("\\left", "").replace("\\right", "")
    base_latex = _strip_outer_parens(base_latex)
    # Si base ya es \varphi/\phi, la normalización de constantes debe capturarla.
    return _latex_subset_to_sympy_expr(base_latex, phi_const=phi_const)


def main() -> int:
    if len(sys.argv) < 3:
        print("false")
        return 0
    expected_inner = sys.argv[1]
    obtained_inner = sys.argv[2]
    print("true" if equivalent(expected_inner, obtained_inner) else "false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
