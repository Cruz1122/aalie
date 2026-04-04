"""
Patrón: merge lineal con dos punteros (WHILE (i <= n AND j <= m), avanza i o j).

Author: AALIE
"""

from typing import Any, Dict, List

from .base import IterationBoundResult, TerminationResult, WhilePattern


class MergeTwoPointersPattern(WhilePattern):
    """
    Dos relacionales en AND con variables distintas; en el cuerpo cada variable
    avanza con +1 en ramas disjuntas (IF/ELSE). Cota total de iteraciones: n + m
    (suma de los límites de cada puntero respecto a su longitud).
    """

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        updates = while_ctx.get("updates", {})
        if not guard or not updates:
            return False
        if getattr(guard, "kind", "") != "and":
            return False
        atoms: List[Dict[str, Any]] = []
        for atom in getattr(guard, "atoms", None) or []:
            if not isinstance(atom, dict):
                continue
            if atom.get("bool_desired") is not None:
                continue
            if atom.get("op") not in ("<", "<="):
                continue
            if not atom.get("var") or atom.get("limit") is None:
                continue
            atoms.append(atom)
        if len(atoms) != 2:
            return False
        v0, v1 = atoms[0].get("var"), atoms[1].get("var")
        if not v0 or not v1 or v0 == v1:
            return False
        for v in (v0, v1):
            su = updates.get(v)
            if not su:
                return False
            inc = False
            for u in su.must_updates + su.may_updates:
                if u.get("type") == "num" and u.get("operator") == "+":
                    inc = True
                    break
            if not inc:
                return False
        return True

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        guard = while_ctx.get("guard_info")
        atoms = [
            a
            for a in (getattr(guard, "atoms", None) or [])
            if isinstance(a, dict)
            and a.get("bool_desired") is None
            and a.get("op") in ("<", "<=")
        ]
        if len(atoms) < 2:
            return IterationBoundResult(
                exact_symbolic_bound=None,
                asymptotic_bound="O(n)",
                not_proven=True,
            )
        lim0 = str(atoms[0].get("limit", "n")).strip()
        lim1 = str(atoms[1].get("limit", "m")).strip()
        bound = f"{lim0} + {lim1}"
        return IterationBoundResult(
            exact_symbolic_bound=bound,
            asymptotic_bound="O(n)",
            not_proven=False,
            iterations_class="linear",
            evidence_level="strong",
            reason_code="while_merge_two_pointers",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return [
            "Merge two pointers: AND of two bounds; each iteration advances one index"
        ]
