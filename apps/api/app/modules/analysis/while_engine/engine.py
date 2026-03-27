"""
Motor WHILE unificado.

Coordina guard, updates, control variables, progress proofs y patrones.
Produce WhileAnalysisResult para consumo del visitor.

Author: @Cruz1122
Version: 0.1.0
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .classifier import classify_while
from .control_variables import detect_control_variables
from .guard_analysis import analyze_guard_for_engine
from .patterns.binary_search_interval import BinarySearchIntervalPattern
from .patterns.euclid_mod import EuclidModPattern
from .patterns.flag_kill import FlagKillPattern
from .patterns.geometric_growth import GeometricGrowthPattern
from .patterns.linear_counter import LinearCounterPattern
from .progress_proofs import prove_progress
from .update_analysis import analyze_updates


@dataclass
class WhileAnalysisInput:
    """Entrada para el engine."""

    while_node: Dict[str, Any]
    parent_context: Optional[Dict] = None
    procedure_context: Optional[Dict] = None
    mode: str = "worst"
    symbol_table: Optional[Any] = None
    global_analysis_ctx: Optional[Dict] = None


@dataclass
class WhileAnalysisResult:
    """Salida del engine."""

    status: str  # bounded | unbounded | unknown | not_proven
    termination: str  # proven_terminating | proven_non_terminating | not_proven
    iterations_expr: Optional[str] = None
    asymptotic_class: Optional[str] = None
    dominant_controller: Optional[str] = None
    supporting_controllers: List[str] = field(default_factory=list)
    ranking_expr: Optional[Any] = None
    pattern_used: Optional[str] = None
    reason_code: Optional[str] = None
    diagnostics: List[str] = field(default_factory=list)
    line_cost_payload: Optional[Dict] = None
    # Campos para compatibilidad con visitor (closure_info)
    variable: Optional[str] = None
    limit: Optional[str] = None
    change_rule: Optional[Dict] = None
    operator: Optional[str] = None
    evidence: Optional[Dict] = None


# Patrones en orden de prioridad
_PATTERNS = [
    ("linear_counter", LinearCounterPattern()),
    ("geometric_growth", GeometricGrowthPattern()),
    ("flag_kill", FlagKillPattern()),
    ("euclid_mod", EuclidModPattern()),
    ("binary_search_interval", BinarySearchIntervalPattern()),
]


class WhileEngine:
    """Motor de análisis WHILE."""

    def analyze(self, input_data: WhileAnalysisInput) -> WhileAnalysisResult:
        """
        Analiza un bucle WHILE y retorna resultado estructurado.

        Usa classify_while existente como base; aplica patrones para refinar.
        """
        node = input_data.while_node
        test = node.get("test")
        body = node.get("body")
        mode = input_data.mode
        parent = input_data.parent_context
        L = node.get("pos", {}).get("line", 0) if isinstance(node.get("pos"), dict) else 0

        # 1) Guard
        guard = analyze_guard_for_engine(test)
        vars_used = getattr(guard, "vars_used", set()) or set()

        # Incluir variables asignadas en el cuerpo para permitir cotas auxiliares
        # en guards booleanos (ej. WHILE(swapped) con longitud <- longitud - 1).
        assigned_vars: set[str] = set()

        def _collect_assigned(node_obj: Any) -> None:
            if isinstance(node_obj, dict):
                if str(node_obj.get("type", "")).lower() == "assign":
                    target = node_obj.get("target", {})
                    if isinstance(target, dict) and str(target.get("type", "")).lower() == "identifier":
                        name = target.get("name", "")
                        if isinstance(name, str) and name:
                            assigned_vars.add(name)
                for child in node_obj.values():
                    _collect_assigned(child)
            elif isinstance(node_obj, list):
                for item in node_obj:
                    _collect_assigned(item)

        _collect_assigned(body)
        vars_used = set(vars_used).union(assigned_vars)

        # 2) Updates
        updates = analyze_updates(node, vars_used, guard, parent)

        # 3) Clasificación existente (compatibilidad)
        try:
            classify_result = classify_while(guard, updates, mode, parent, L)
        except Exception as e:
            return WhileAnalysisResult(
                status="unknown",
                termination="not_proven",
                reason_code="while_unbounded_unknown",
                diagnostics=[str(e)],
            )

        status = getattr(classify_result, "status", "unknown")
        reason_code = getattr(classify_result, "reason_code", None)
        iterations_expr = getattr(classify_result, "iterations_expr", None)
        if iterations_expr is not None:
            iterations_expr = str(iterations_expr)
        evidence = getattr(classify_result, "evidence", None) or {}

        # 4) Control variables y progress
        control = detect_control_variables(guard, updates, input_data.symbol_table)

        # Extraer variable, limit, change_rule para visitor
        var_name = evidence.get("var") or (control.primary_numeric_controller if control else None)
        limit = evidence.get("limit", "n")
        op_rel = evidence.get("op", "<")
        change_rule = {}
        if var_name and updates.get(var_name):
            for u in getattr(updates[var_name], "must_updates", []):
                if u.get("type") == "num":
                    change_rule = {"operator": u.get("operator", "+"), "constant": str(u.get("constant", "1"))}
                    break
        progress = prove_progress(guard, updates, control)

        # 5) Intentar patrones para refinar
        while_ctx = {
            "guard_info": guard,
            "updates": updates,
            "control_variables": control,
            "progress_proof": progress,
            "mode": mode,
        }
        for pattern_name, pattern in _PATTERNS:
            if pattern.matches(while_ctx):
                iter_result = pattern.derive_iterations(while_ctx)
                # El patrón es autoritativo: usar su cota cuando coincida
                if iter_result.exact_symbolic_bound:
                    iterations_expr = iter_result.exact_symbolic_bound
                # Best case: si classify ya dio 1 (flag kill), preferir sobre linear_counter
                if mode == "best" and str(classify_result.iterations_expr) == "1":
                    iterations_expr = "1"
                    asymptotic_class = "O(1)"
                else:
                    asymptotic_class = iter_result.asymptotic_bound
                # Patrón acotado: marcar status como bounded para que el visitor use el resultado
                effective_status = "bounded" if iter_result.exact_symbolic_bound else status
                return WhileAnalysisResult(
                    status=effective_status,
                    termination="proven_terminating" if progress.proven else "not_proven",
                    iterations_expr=iterations_expr,
                    asymptotic_class=asymptotic_class,
                    dominant_controller=control.primary_numeric_controller or control.primary_boolean_controller,
                    pattern_used=pattern_name,
                    reason_code=reason_code,
                    diagnostics=pattern.explain(while_ctx),
                    variable=var_name,
                    limit=limit,
                    change_rule=change_rule or {"operator": "+", "constant": "1"},
                    operator=op_rel,
                    evidence=evidence,
                )

        return WhileAnalysisResult(
            status=status,
            termination="proven_terminating" if progress.proven else "not_proven",
            iterations_expr=iterations_expr,
            asymptotic_class=None,
            dominant_controller=control.primary_numeric_controller or control.primary_boolean_controller,
            reason_code=reason_code,
            diagnostics=[],
            variable=var_name,
            limit=limit,
            change_rule=change_rule or {"operator": "+", "constant": "1"},
            operator=op_rel,
            evidence=evidence,
        )
