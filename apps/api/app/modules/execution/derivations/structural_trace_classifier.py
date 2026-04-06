"""
Clasificador estructural de trazas de ejecución.

Detecta la morfología del algoritmo (no su nombre) a partir de la traza.
Entrada: ExecutionTrace. Salida: StructuralTraceClassification.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional

StructuralPatternKind = Literal[
    "generic_iterative",
    "iterative_with_auxiliary_operation",
    "generic_recursive",
    "tail_recursive_linear",
    "single_branch_recursive_search",
    "binary_branch_recursive",
    "multi_branch_recursive_fanout",
    "divide_partition_recurse",
    "divide_merge_recurse",
    "divide_compute_recurse",
    "backtracking_stateful",
    "mutual_recursion",
    "hybrid_recursive_iterative",
    "unknown",
]


@dataclass
class StructuralTraceClassification:
    """Resultado de la clasificación estructural de una traza."""

    patternKind: StructuralPatternKind
    confidence: Literal["high", "medium", "low"]
    evidence: List[str]


def _get_call_tree(trace: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Obtiene el árbol de recursión del trace (recursionTree o callTreeSource)."""
    rt = trace.get("recursionTree") or trace.get("callTreeSource")
    if not rt or not rt.get("calls"):
        return None
    return rt


def _get_steps(trace: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Obtiene los pasos del trace."""
    return trace.get("steps", [])


def _calls_by_id(calls: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Indexa llamadas por id."""
    return {c["id"]: c for c in calls}


def _count_children_per_call(calls: List[Dict[str, Any]]) -> Dict[str, int]:
    """Cuenta hijos por cada llamada."""
    return {c["id"]: len(c.get("children", [])) for c in calls}


def _has_partition_like_pattern(steps: List[Dict[str, Any]], calls: List[Dict[str, Any]]) -> bool:
    """
    Detecta patrón tipo quicksort: asignación que produce índice + 2 subllamadas.
    Heurística: hay asignaciones a variable índice (q, pivot, mid) antes de las subllamadas.
    """
    if len(calls) < 3:
        return False
    child_counts = _count_children_per_call(calls)
    two_child_calls = [cid for cid, n in child_counts.items() if n == 2]
    if not two_child_calls:
        return False
    # Buscar steps con assign que podrían ser partition (ej. q = partition(...), mid = ...)
    assign_vars = set()
    for s in steps:
        if (s.get("kind") or s.get("eventKind")) == "assign":
            desc = s.get("description", "")
            # Heurística: si hay asignación con = y variable de índice típica
            if "=" in desc or "←" in desc:
                var_part = desc.split("=")[0].split("←")[0].strip()
                if var_part and len(var_part) <= 3:  # q, mid, p, etc.
                    assign_vars.add(var_part)
    return len(two_child_calls) >= 1 and len(assign_vars) >= 1


def _has_merge_like_pattern(steps: List[Dict[str, Any]], calls: List[Dict[str, Any]]) -> bool:
    """
    Detecta patrón merge: subllamadas primero, luego operación de combinación.
    Heurística: tras volver de subllamadas debe aparecer evidencia real de combinación
    (llamada helper merge/combine o escritura sobre una colección/arreglo).
    """
    if len(calls) < 2:
        return False
    in_resume = False
    collection_writes_after_resume = 0
    merge_keywords_after_resume = 0

    for step in steps:
        kind = step.get("kind") or step.get("eventKind")
        description = str(step.get("description") or "").lower()

        if kind == "call_resume":
            in_resume = True
            continue

        if not in_resume:
            continue

        if kind in {"call_spawn_child", "call_enter"}:
            proc = str(((step.get("recursion") or {}).get("procedure")) or "").lower()
            if proc and any(token in proc for token in ("merge", "mezclar", "combine", "combinar")):
                merge_keywords_after_resume += 1
            continue

        if kind == "assign":
            if "[" in description or any(
                token in description for token in ("merge", "mezclar", "combine", "combinar")
            ):
                collection_writes_after_resume += 1
            continue

        if kind in {"return_emit", "call_exit"}:
            continue

        if any(token in description for token in ("merge", "mezclar", "combine", "combinar")):
            merge_keywords_after_resume += 1

    return merge_keywords_after_resume >= 1 or collection_writes_after_resume >= 2


def _has_backtracking_pattern(steps: List[Dict[str, Any]]) -> bool:
    """
    Detecta backtracking: elección, mutación, recursión, undo.
    Heurística simplificada: condition_eval + assign + call_spawn_child en secuencia,
    con posible "undo" implícito (asignación que restaura estado).
    """
    kinds = [(s.get("kind") or s.get("eventKind")) for s in steps]
    has_condition = "condition_eval" in kinds
    has_assign = "assign" in kinds
    has_recursive_call = "call_spawn_child" in kinds or "call_enter" in kinds
    return has_condition and has_assign and has_recursive_call


def _is_tail_recursive(calls: List[Dict[str, Any]], child_counts: Dict[str, int]) -> bool:
    """
    Tail recursive: cada nodo tiene 0 o 1 hijo; el hijo está "al final" (única rama).
    """
    for c in calls:
        n = child_counts.get(c["id"], 0)
        if n > 1:
            return False
    return True


def _is_single_branch_search(calls: List[Dict[str, Any]], child_counts: Dict[str, int]) -> bool:
    """
    Single branch: cada nodo tiene como máximo 1 hijo efectivo (la otra rama es base/return).
    """
    for c in calls:
        n = child_counts.get(c["id"], 0)
        if n > 1:
            return False
    return True


def _has_auxiliary_operation_iterative(steps: List[Dict[str, Any]]) -> bool:
    """
    Iterativo con operación auxiliar: muchos assigns en contexto de loop, o swap/update.
    """
    assign_count = sum(1 for s in steps if (s.get("kind") or s.get("eventKind")) == "assign")
    loop_count = sum(
        1
        for s in steps
        if (s.get("kind") or s.get("eventKind")) in ("loop_iter_enter", "loop_enter")
    )
    return assign_count >= 3 and loop_count >= 1


def classify_structural_trace(trace: Dict[str, Any]) -> StructuralTraceClassification:
    """
    Clasifica la morfología del algoritmo a partir de la traza.

    Args:
        trace: ExecutionTrace enriquecido (steps, recursionTree/callTreeSource, kind)

    Returns:
        StructuralTraceClassification con patternKind, confidence, evidence
    """
    kind = trace.get("kind", "unknown")
    steps = _get_steps(trace)
    call_tree = _get_call_tree(trace)

    # Caso iterativo
    if kind == "iterative":
        return StructuralTraceClassification(
            patternKind="generic_iterative",
            confidence="high",
            evidence=["trace.kind == iterative", "no recursion"],
        )

    # Caso híbrido
    if kind == "hybrid":
        return StructuralTraceClassification(
            patternKind="hybrid_recursive_iterative",
            confidence="medium",
            evidence=["trace.kind == hybrid", "recursion with internal loops"],
        )

    # Caso recursivo
    if kind == "recursive" and call_tree:
        calls = call_tree.get("calls", [])
        child_counts = _count_children_per_call(calls)

        # divide_partition_recurse (quicksort-like)
        if _has_partition_like_pattern(steps, calls):
            return StructuralTraceClassification(
                patternKind="divide_partition_recurse",
                confidence="high",
                evidence=[
                    "2 child calls per node",
                    "local operation produces index before subcalls",
                ],
            )

        # divide_merge_recurse (mergesort-like)
        if _has_merge_like_pattern(steps, calls):
            return StructuralTraceClassification(
                patternKind="divide_merge_recurse",
                confidence="medium",
                evidence=[
                    "subcalls first, then merge/combine operation",
                    "assigns after call_resume",
                ],
            )

        # backtracking_stateful
        if _has_backtracking_pattern(steps):
            max_children = max(child_counts.values(), default=0)
            if max_children <= 2:
                return StructuralTraceClassification(
                    patternKind="backtracking_stateful",
                    confidence="medium",
                    evidence=[
                        "condition + assign + recursive call pattern",
                        "possible undo/restore",
                    ],
                )

        # Contar hijos
        max_children = max(child_counts.values(), default=0)

        # multi_branch_recursive_fanout
        if max_children > 2:
            return StructuralTraceClassification(
                patternKind="multi_branch_recursive_fanout",
                confidence="high",
                evidence=[f"max {max_children} child calls per node"],
            )

        # binary_branch_recursive (Fibonacci, etc.)
        if max_children == 2:
            return StructuralTraceClassification(
                patternKind="binary_branch_recursive",
                confidence="high",
                evidence=[
                    "exactly 2 child calls per node",
                    "no partition/merge pattern",
                ],
            )

        # tail_recursive_linear o single_branch_recursive_search
        if max_children <= 1:
            # single_branch: búsqueda binaria, etc. (condición guía qué rama)
            # tail: factorial acumulativo, etc. (una llamada al final)
            # Heurística: si hay muchas condition_eval -> single_branch_search
            condition_count = sum(
                1 for s in steps if (s.get("kind") or s.get("eventKind")) == "condition_eval"
            )
            if condition_count >= 2:
                return StructuralTraceClassification(
                    patternKind="single_branch_recursive_search",
                    confidence="medium",
                    evidence=[
                        "1 effective recursive call per node",
                        "condition-guided branch (search)",
                    ],
                )
            return StructuralTraceClassification(
                patternKind="tail_recursive_linear",
                confidence="high",
                evidence=["1 recursive call at tail", "no work after call"],
            )
    elif kind == "recursive" and not call_tree:
        return StructuralTraceClassification(
            patternKind="generic_recursive",
            confidence="low",
            evidence=["trace.kind == recursive but no call tree"],
        )

    # Fallback recursivo
    if kind == "recursive":
        return StructuralTraceClassification(
            patternKind="generic_recursive",
            confidence="medium",
            evidence=["recursive fallback", "no specific pattern matched"],
        )

    return StructuralTraceClassification(
        patternKind="unknown",
        confidence="low",
        evidence=[f"trace.kind == {kind}", "unclassified"],
    )
