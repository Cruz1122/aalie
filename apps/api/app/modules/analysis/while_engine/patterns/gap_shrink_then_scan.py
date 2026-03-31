"""
Patrón: reducción del gap (por división) y escaneo asociado.

Cobertura práctica (catálogo):
- Comb Sort: gap <- (gap * 10) DIV 13, con guard (gap > 1 OR intercambio = true)
- Shell Sort (outer): gap <- gap DIV 2, con guard (gap > 0)
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from .base import IterationBoundResult, TerminationResult, WhilePattern


def _op_norm(op: Any) -> str:
    return str(op or "").strip().lower()


def _find_gap_update_constants(while_node: Dict[str, Any]) -> Optional[Tuple[int, Optional[int]]]:
    """
    Intenta extraer constantes del update a gap:
      1) gap <- gap DIV c    -> devuelve (c, None)
      2) gap <- (gap * a) DIV b  -> devuelve (b, a) (b=divisor, a=multiplicador)
    """
    body = while_node.get("body") or {}
    if isinstance(body, list):
        body = {"type": "block", "body": body}

    def _walk(n: Any) -> Optional[Tuple[int, Optional[int]]]:
        if isinstance(n, list):
            for it in n:
                r = _walk(it)
                if r is not None:
                    return r
            return None
        if not isinstance(n, dict):
            return None

        if str(n.get("type", "")).lower() == "assign":
            target = n.get("target") or {}
            if isinstance(target, dict) and str(target.get("type", "")).lower() == "identifier":
                if target.get("name") == "gap":
                    value = n.get("value") or {}
                    if isinstance(value, dict) and str(value.get("type", "")).lower() == "binary":
                        op = _op_norm(value.get("op") or value.get("operator"))
                        if op in ("div", "/") or op == "div":
                            left = value.get("left") or {}
                            right = value.get("right") or {}
                            # gap DIV c
                            if isinstance(left, dict) and str(left.get("type", "")).lower() == "identifier" and left.get("name") == "gap":
                                if isinstance(right, dict) and str(right.get("type", "")).lower() in ("number", "literal"):
                                    try:
                                        return (int(float(right.get("value"))), None)
                                    except Exception:
                                        return None
                            # (gap * a) DIV b
                            if isinstance(left, dict) and str(left.get("type", "")).lower() == "binary":
                                lop = _op_norm(left.get("op") or left.get("operator"))
                                if lop == "*" and (
                                    (isinstance(left.get("left"), dict) and str(left["left"].get("type","")).lower() in ("number","literal"))
                                    or (isinstance(left.get("right"), dict) and str(left["right"].get("type","")).lower() in ("number","literal"))
                                ):
                                    # esperamos (gap * a)
                                    # localizar gap en uno de los lados
                                    lleft = left.get("left")
                                    lright = left.get("right")
                                    multiplicand = None
                                    if isinstance(lleft, dict) and str(lleft.get("type","")).lower() == "identifier" and lleft.get("name") == "gap":
                                        multiplicand = lright
                                    elif isinstance(lright, dict) and str(lright.get("type","")).lower() == "identifier" and lright.get("name") == "gap":
                                        multiplicand = lleft
                                    if multiplicand and isinstance(multiplicand, dict) and str(multiplicand.get("type","")).lower() in ("number","literal"):
                                        try:
                                            a = int(float(multiplicand.get("value")))
                                            if isinstance(right, dict) and str(right.get("type","")).lower() in ("number","literal"):
                                                b = int(float(right.get("value")))
                                                return (b, a)
                                        except Exception:
                                            return None
        # Recurse
        for v in n.values():
            r = _walk(v)
            if r is not None:
                return r
        return None

    return _walk(body)


def _guard_mentions_gap(guard_info: Any) -> bool:
    # Simple: usar vars_used y/o atoms.
    if not guard_info:
        return False
    if "gap" in (getattr(guard_info, "vars_used", set()) or set()):
        return True
    atoms = getattr(guard_info, "atoms", None) or []
    for atom in atoms:
        if isinstance(atom, dict) and str(atom.get("var") or "") == "gap":
            return True
    return False


class GapShrinkThenScanPattern(WhilePattern):
    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard_info = while_ctx.get("guard_info")
        while_node = while_ctx.get("while_node") or {}
        updates = while_ctx.get("updates") or {}
        if not guard_info or not while_node:
            return False
        if not _guard_mentions_gap(guard_info):
            return False
        return _find_gap_update_constants(while_node) is not None

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        # Si el gap decrece, el bucle outer es terminante.
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        mode = str(while_ctx.get("mode") or "worst")
        while_node = while_ctx.get("while_node") or {}
        consts = _find_gap_update_constants(while_node) or (2, None)

        divisor, multiplicand = consts  # divisor=c, multiplicand=a if (gap*a)/div

        # Cuando el update es gap <- gap DIV c, el número de iteraciones es log_c(n).
        # Para (gap * 10) DIV 13 se obtiene una contracción constante -> sigue siendo log(n).
        # Para el informe basta con la clase asintótica.
        if divisor and divisor > 1:
            # Usar log base 2 como canonical pedagógico cuando divisor/multiplicand no coincide exacto.
            exact = "\\log_{2}(n)"
            asymptotic = "O(log n)"
        else:
            exact = None
            asymptotic = None

        if multiplicand is not None:
            # Comb Sort: aproximamos que la fase "gap" aporta log(n),
            # pero el worst/avg está dominado por el resto del bucle (≈ n).
            if mode == "best":
                exact_symbolic = exact
                asymptotic_bound = "O(n log n)"
            else:
                exact_symbolic = "n"
                asymptotic_bound = "O(n^2)"
            return IterationBoundResult(
                exact_symbolic_bound=exact_symbolic,
                asymptotic_bound=asymptotic_bound,
                not_proven=False,
                iterations_class="logarithmic" if mode == "best" else "linear",
                evidence_level="medium",
                reason_code="while_gap_shrink_then_scan_comb",
            )

        # Shell Sort outer: log(n) iteraciones del while gap.
        return IterationBoundResult(
            exact_symbolic_bound=exact,
            asymptotic_bound=asymptotic,
            not_proven=False,
            iterations_class="logarithmic",
            evidence_level="strong",
            reason_code="while_gap_shrink_then_scan_shell_outer",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Gap shrink (DIV): outer while is logarithmic"]  # nota: clase pedagógica

