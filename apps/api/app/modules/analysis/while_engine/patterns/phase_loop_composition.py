"""
Patrón: composición por fases (Jump Search outer WHILE).

Salto por bloques:
  WHILE (fin < n AND A[fin] < x) DO BEGIN
    inicio <- fin + 1;
    fin <- fin + paso;
  END

Aquí el número de iteraciones del WHILE crece como n/paso.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from .base import IterationBoundResult, TerminationResult, WhilePattern


def _op_norm(op: Any) -> str:
    return str(op or "").strip().lower()

def _walk_ast(node: Any):
    if isinstance(node, list):
        for it in node:
            yield from _walk_ast(it)
        return
    if not isinstance(node, dict):
        return
    yield node
    for v in node.values():
        yield from _walk_ast(v)


def _find_guard_fin_var(while_node: Dict[str, Any]) -> Optional[str]:
    """
    Para Jump Search en catálogo:
      WHILE (fin < n AND A[fin] < x) ...
    """
    test = while_node.get("test") or {}
    if not isinstance(test, dict):
        return None

    # Buscar algún relacional fin < n
    for node in _walk_ast(test):
        if not isinstance(node, dict):
            continue
        if str(node.get("type", "")).lower() not in ("binary", "binaryop"):
            continue
        op = _op_norm(node.get("op") or node.get("operator"))
        if op not in ("<", "<="):
            continue
        left = node.get("left")
        right = node.get("right")
        if (
            isinstance(left, dict)
            and str(left.get("type", "")).lower() == "identifier"
            and str(right.get("type", "")).lower() in ("identifier",)
            and str(right.get("name", "")).strip() == "n"
        ):
            return str(left.get("name") or "").strip()
        if (
            isinstance(right, dict)
            and str(right.get("type", "")).lower() == "identifier"
            and str(left.get("type", "")).lower() in ("identifier",)
            and str(left.get("name", "")).strip() == "n"
        ):
            # n > fin -> equivalente fin < n
            return str(right.get("name") or "").strip()
    return None


def _find_fin_update_step_var(
    while_node: Dict[str, Any], fin_var: str
) -> Optional[str]:
    """
    Para Jump Search en catálogo:
      fin <- fin + paso;
    """
    body = while_node.get("body") or {}
    for node in _walk_ast(body):
        if not isinstance(node, dict):
            continue
        if str(node.get("type", "")).lower() != "assign":
            continue
        target = node.get("target") or {}
        if not isinstance(target, dict) or str(target.get("type", "")).lower() != "identifier":
            continue
        if str(target.get("name") or "").strip() != fin_var:
            continue

        value = node.get("value") or {}
        if not isinstance(value, dict):
            continue
        if str(value.get("type", "")).lower() not in ("binary", "binaryop"):
            continue
        op = _op_norm(value.get("op") or value.get("operator"))
        if op != "+":
            continue

        left = value.get("left")
        right = value.get("right")
        # fin + paso (en cualquier orden)
        if (
            isinstance(left, dict)
            and str(left.get("type", "")).lower() == "identifier"
            and str(left.get("name") or "").strip() == fin_var
            and isinstance(right, dict)
            and str(right.get("type", "")).lower() == "identifier"
        ):
            step = str(right.get("name") or "").strip()
            if step:
                return step
        if (
            isinstance(right, dict)
            and str(right.get("type", "")).lower() == "identifier"
            and str(right.get("name") or "").strip() == fin_var
            and isinstance(left, dict)
            and str(left.get("type", "")).lower() == "identifier"
        ):
            step = str(left.get("name") or "").strip()
            if step:
                return step
    return None


def _find_jump_fin_and_step(while_ctx: Dict[str, Any]) -> Optional[Tuple[str, str]]:
    while_node = while_ctx.get("while_node") or {}
    if not isinstance(while_node, dict):
        return None

    fin_var = _find_guard_fin_var(while_node)
    if not fin_var:
        return None
    step_var = _find_fin_update_step_var(while_node, fin_var)
    if not step_var:
        return None
    return fin_var, step_var


class PhaseLoopCompositionPattern(WhilePattern):
    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        if not guard:
            return False
        if getattr(guard, "kind", None) != "and":
            return False
        while_node = while_ctx.get("while_node") or {}
        test = while_node.get("test") or {}
        if not isinstance(test, dict):
            return False
        # Si no hay evidencia de update de fin en el motor, no aplicar.
        return _find_jump_fin_and_step(while_ctx) is not None

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        mode = str(while_ctx.get("mode") or "worst")
        res = _find_jump_fin_and_step(while_ctx)
        if not res:
            return IterationBoundResult(
                exact_symbolic_bound=None,
                asymptotic_bound=None,
                not_proven=True,
                iterations_class=None,
                evidence_level="weak",
            )

        _, step_var = res

        if mode == "best":
            exact = "1"
            asymptotic = "O(1)"
            klass = "constant"
        else:
            exact = f"\\\\frac{{n}}{{{step_var}}}"
            asymptotic = f"O(n / {step_var})"
            klass = "linear"

        return IterationBoundResult(
            exact_symbolic_bound=exact,
            asymptotic_bound=asymptotic,
            not_proven=False,
            iterations_class=klass,
            evidence_level="medium",
            reason_code="while_jump_search_phase_composition",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return ["Jump search: phase jump count ~ n/paso"]

