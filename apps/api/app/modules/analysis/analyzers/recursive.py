import math
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from sympy import (
    Abs,
    Eq,
    Expr,
    Function,
    I,
    Integer,
    Poly,
    Pow,
    Rational,
    Symbol,
    expand,
    factor,
    latex,
    limit,
    oo,
    rsolve,
    simplify,
    solve,
    sqrt,
    summation,
    sympify,
)
from sympy import (
    Sum as SymSum,
)
from sympy import (
    log as sympy_log,
)
from sympy import (
    roots as sympy_roots,
)

from .base import BaseAnalyzer
from .characteristic_steps import StepContext, build_characteristic_step_bundle
from .iteration_steps import IterationStepContext, build_iteration_step_bundle
from .master_steps import MasterStepContext, build_master_step_bundle
from .recursion_tree_steps import (
    RecursionTreeStepContext,
    build_recursion_tree_step_bundle,
)


@dataclass(frozen=True)
class RecursiveCallSite:
    node: Dict[str, Any]
    call_name: str
    args: List[Dict[str, Any]] = field(default_factory=list)
    line: Optional[int] = None


@dataclass(frozen=True)
class GuardEvidence:
    node: Dict[str, Any]
    kind: str  # "structural_base_case" | "data_dependent" | "unknown"
    pattern: str  # stable pattern key, not free-form prose
    line: Optional[int] = None
    related_size_symbols: Set[str] = field(default_factory=set)


@dataclass(frozen=True)
class RecursiveExpansionDeterminism:
    level: str  # "strong" | "medium" | "weak"
    details: List[str] = field(default_factory=list)  # reason codes


@dataclass(frozen=True)
class RecursiveExpansionProfile:
    recursive_call_sites: List[RecursiveCallSite] = field(default_factory=list)
    calls_before_any_non_base_return: bool = False
    base_case_guards: List[GuardEvidence] = field(default_factory=list)
    size_signals: Dict[str, Any] = field(default_factory=dict)
    data_dependent_guards: List[GuardEvidence] = field(default_factory=list)
    expansion_determinism: RecursiveExpansionDeterminism = field(
        default_factory=lambda: RecursiveExpansionDeterminism(level="weak", details=[])
    )
    has_pruning: bool = False
    has_case_variability: Optional[bool] = None
    reason_codes: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class CaseVariabilityDecision:
    kind: str  # "deterministic_structural_recursion" | "data_dependent_pruning" | "unknown_variability"
    has_case_variability: Optional[bool]
    reason_codes: List[str] = field(default_factory=list)


class RecursiveAnalyzer(BaseAnalyzer):
    """
    Analizador para algoritmos recursivos divide-and-conquer.

    Extrae recurrencias de la forma T(n) = a·T(n/b) + f(n)
    y las resuelve mediante el Teorema Maestro, método de iteración o árbol de recursión.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """

    def __init__(self, locale: str = "en"):
        """
        Inicializa una instancia de RecursiveAnalyzer.

        Args:
            locale: Código de idioma para etiquetas del procedimiento ("en" | "es")

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        super().__init__(locale=locale)
        self.procedure_name: Optional[str] = None
        self.proc_def: Optional[Dict[str, Any]] = None
        self.ast: Optional[Dict[str, Any]] = (
            None  # Guardar AST completo para buscar funciones auxiliares
        )
        self.recurrence: Optional[Dict[str, Any]] = None
        self.master: Optional[Dict[str, Any]] = None
        self.iteration: Optional[Dict[str, Any]] = None
        self.recursion_tree: Optional[Dict[str, Any]] = None
        self.proof: List[Dict[str, str]] = []
        self.proof_steps: List[Dict[str, str]] = []
        self.dp_validation_events: List[Dict[str, Any]] = []
        # Inicializar expr_converter si no está en BaseAnalyzer
        if not hasattr(self, "expr_converter"):
            from .expr_converter import ExprConverter

            self.expr_converter = ExprConverter()

    def analyze(
        self,
        ast: Dict[str, Any],
        mode: str = "worst",
        api_key: Optional[str] = None,
        avg_model: Optional[Dict[str, Any]] = None,
        preferred_method: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analiza un AST recursivo y retorna el resultado con recurrencia y Teorema Maestro.

        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            api_key: API Key (ignorado, mantenido por compatibilidad)
            avg_model: Modelo promedio (ignorado por ahora, recursivos normalmente tienen mismo costo)
            preferred_method: Método preferido ("characteristic_equation", "iteration", "recursion_tree", "master")

        Returns:
            Resultado del análisis con recurrence, master, proof, etc.

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Limpiar estado previo
        self.clear()
        self.mode = mode
        self.ast = ast  # Guardar AST completo

        # 1. Encontrar el procedimiento principal
        proc_def = self._find_main_procedure(ast)
        if not proc_def:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": "No se encontró un procedimiento principal",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        self.proc_def = proc_def  # Guardar para uso posterior
        self.procedure_name = proc_def.get("name")

        # 2.1. Detectar variables de tamaño candidatas a partir del ProcDef
        # Mantendremos la notación estándar T(n), pero registraremos el mapeo si
        # el parámetro real tiene otro nombre.
        try:
            size_candidates = self.detect_size_variables_from_proc(proc_def)
        except Exception:
            size_candidates = []
        if size_candidates:
            primary = size_candidates[0]
            if isinstance(primary, str) and primary and primary != "n":
                # Registrar que nuestro 'n' conceptual corresponde a este parámetro
                self.add_symbol("n", primary)

        # 2. Validar condiciones iniciales (divide-and-conquer canónico)
        validation_result = self._validate_conditions(proc_def)
        if not validation_result["valid"]:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": f"No aplicable: {validation_result['reason']}",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        # 2.5. Perfil de expansión recursiva y decisión de variabilidad (contractual).
        # Esta fase separa:
        # - caso base estructural (no autoriza best asintótico distinto)
        # - poda dependiente de datos (sí puede justificar best diferente)
        profile = self._build_recursive_expansion_profile(proc_def)
        decision = self._classify_case_variability(profile)
        self.expansion_profile = profile  # debug/inspección (no contractual por sí mismo)
        self.case_variability_decision = decision

        # Shortcut Θ(1) solo si hay evidencia de poda dependiente de datos.
        if mode == "best" and decision.kind == "data_dependent_pruning":
            if profile.calls_before_any_non_base_return:
                self.proof_steps.append(
                    {
                        "id": "best_case_data_pruning",
                        "text": (
                            "\\text{Mejor caso: } \\Theta(1) "
                            "\\text{ (poda dependiente de datos evita la recursión)}"
                        ),
                    }
                )
                return {
                    "ok": True,
                    "byLine": [],
                    "totals": {
                        "T_open": "\\Theta(1)",
                        "big_theta": "\\Theta(1)",
                        "symbols": None,
                        "notes": {
                            "case_variability_decision": {
                                "kind": decision.kind,
                                "has_case_variability": decision.has_case_variability,
                                "reason_codes": decision.reason_codes,
                            }
                        },
                        "proof": self.proof_steps.copy(),
                    },
                }

        # 3. Extraer recurrencia (puede usar preferred_method si se proporciona)
        extraction_result = self._extract_recurrence(proc_def, preferred_method=preferred_method)
        if not extraction_result["success"]:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": f"Error extrayendo recurrencia: {extraction_result['reason']}",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        self.recurrence = extraction_result["recurrence"]

        if self.recurrence.get("type") == "divide_conquer":
            self._build_non_dp_validation(
                "La recurrencia es divide-and-conquer; debe priorizarse Teorema Maestro, iteración o árbol de recursión antes que PD."
            )

        # Si no es aplicable ningún método, retornar error
        if not self.recurrence.get("applicable", False):
            return {
                "ok": False,
                "errors": [
                    {
                        "message": f"No aplicable: {self.recurrence.get('notes', ['Razón desconocida'])[0]}",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        # 4. Aplicar método apropiado
        # Si se proporcionó preferred_method, usarlo directamente
        if preferred_method:
            method = preferred_method
            # Validar que el método preferido es aplicable
            if method not in [
                "characteristic_equation",
                "iteration",
                "recursion_tree",
                "master",
            ]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Método preferido inválido: {preferred_method}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }
        else:
            # Usar la prioridad automática (PRIORIDAD: Ecuación Característica > Iteración > Árbol > Maestro)
            method = self.recurrence.get("method", "master")

        if method == "characteristic_equation":
            # Aplicar Método de Ecuación Característica (PRIORIDAD ALTA)
            char_eq_result = self._apply_characteristic_equation_method()
            if not char_eq_result["success"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Error aplicando Método de Ecuación Característica: {char_eq_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            self.characteristic_equation = char_eq_result["characteristic_equation"]
        elif method == "iteration":
            # Aplicar Método de Iteración
            iteration_result = self._apply_iteration_method()
            if not iteration_result["success"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Error aplicando Método de Iteración: {iteration_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            self.iteration = iteration_result["iteration"]
        elif method == "recursion_tree":
            # Aplicar Método de Árbol de Recursión
            tree_result = self._apply_recursion_tree_method()
            if not tree_result["success"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Error aplicando Método de Árbol de Recursión: {tree_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            self.recursion_tree = tree_result["recursion_tree"]
        else:
            # Aplicar Teorema Maestro
            master_result = self._apply_master_theorem()
            if not master_result["success"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Error aplicando Teorema Maestro: {master_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            self.master = master_result["master"]

        # 5. Generar resultado
        return self.result()

    def detect_applicable_methods(self, ast: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detecta qué métodos de análisis son aplicables para un algoritmo recursivo
        sin ejecutar el análisis completo.

        Args:
            ast: AST del algoritmo a analizar

        Returns:
            {
                "ok": bool,
                "applicable_methods": List[str],
                "default_method": str,
                "recurrence_info": dict
            }
        """
        try:
            # Limpiar estado previo
            self.clear()
            self.mode = "worst"  # Usar worst para detección
            self.ast = ast

            # 1. Encontrar el procedimiento principal
            proc_def = self._find_main_procedure(ast)
            if not proc_def:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": "No se encontró un procedimiento principal",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            self.proc_def = proc_def
            self.procedure_name = proc_def.get("name")

            # 2. Validar condiciones iniciales
            validation_result = self._validate_conditions(proc_def)
            if not validation_result["valid"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"No aplicable: {validation_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            # 3. Extraer recurrencia sin método preferido (para detectar todos los métodos)
            extraction_result = self._extract_recurrence(proc_def, preferred_method=None)
            if not extraction_result["success"]:
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"Error extrayendo recurrencia: {extraction_result['reason']}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            recurrence = extraction_result["recurrence"]

            if not recurrence.get("applicable", False):
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": f"No aplicable: {recurrence.get('notes', ['Razón desconocida'])[0]}",
                            "line": None,
                            "column": None,
                        }
                    ],
                }

            # 4. Detectar todos los métodos aplicables
            # Obtener información necesaria para la detección
            recursive_calls = self._find_recursive_calls(proc_def)
            a = self._calculate_recursive_calls_count(proc_def, recursive_calls)

            # Calcular b (necesario para detect_recursion_tree_method)
            subproblem_sizes = []
            for call in recursive_calls:
                subproblem_info = self._analyze_subproblem_type(call, proc_def)
                if subproblem_info and subproblem_info["type"] not in ["subtraction"]:
                    size_info = self._analyze_subproblem_size(call, proc_def)
                    if size_info:
                        subproblem_sizes.append(size_info)

            b = 2  # Valor por defecto
            if subproblem_sizes:
                b_values = [s["b"] for s in subproblem_sizes if s.get("b")]
                if b_values and len(set(b_values)) == 1:
                    b = b_values[0]

            # Detectar cada método INDEPENDIENTEMENTE (sin prioridad)
            applicable_methods = []
            recurrence_type = recurrence.get("type")

            use_characteristic = False
            use_iteration = False
            use_recursion_tree = False
            use_master = False

            if recurrence_type == "linear_shift":
                # En linear_shift permitimos ecuación característica e iteración (si cubre V1).
                use_characteristic = self._detect_characteristic_equation_method(
                    proc_def, recursive_calls
                )
                use_iteration = self._detect_iteration_method(proc_def, recursive_calls)
                use_recursion_tree = self._detect_recursion_tree_method(
                    proc_def, recursive_calls, a, b
                )
            elif recurrence_type == "divide_conquer":
                # En divide_conquer la ecuación característica no aplica de forma directa.
                use_characteristic = False
                use_master = True
                # Permitir árbol también en rama única (a=1) si hay reducción válida por división.
                use_recursion_tree = self._detect_recursion_tree_method(
                    proc_def, recursive_calls, a, b
                )
                # Iteración geométrica para rama única: T(n)=T(n/b)+Theta(1).
                use_iteration = self._is_single_branch_geometric_divide_conquer_recurrence(
                    recurrence
                )
            else:
                # Fallback conservador para tipos no estandarizados.
                use_characteristic = self._detect_characteristic_equation_method(
                    proc_def, recursive_calls
                )
                use_iteration = self._detect_iteration_method(proc_def, recursive_calls)
                use_recursion_tree = self._detect_recursion_tree_method(
                    proc_def, recursive_calls, a, b
                )
                use_master = recurrence_type == "divide_conquer"

            if recurrence_type == "divide_conquer":
                if use_master:
                    applicable_methods.append("master")
                if use_recursion_tree:
                    applicable_methods.append("recursion_tree")
                if use_iteration:
                    applicable_methods.append("iteration")
            else:
                if use_characteristic:
                    applicable_methods.append("characteristic_equation")
                if use_iteration:
                    applicable_methods.append("iteration")
                if use_recursion_tree:
                    applicable_methods.append("recursion_tree")
                if use_master:
                    applicable_methods.append("master")

            # Determinar método por defecto (prioridad)
            # Si es linear_shift, NO usar master como default (master solo es para divide_conquer)
            if recurrence_type == "linear_shift":
                # Para linear_shift, prioridad: characteristic_equation > iteration > recursion_tree
                if "characteristic_equation" in applicable_methods:
                    default_method = "characteristic_equation"
                elif "iteration" in applicable_methods:
                    default_method = "iteration"
                elif "recursion_tree" in applicable_methods:
                    default_method = "recursion_tree"
                else:
                    default_method = recurrence.get("method", "iteration")
            elif recurrence_type == "divide_conquer":
                # Para divide_conquer, prioridad: master > recursion_tree > iteration
                if "master" in applicable_methods:
                    default_method = "master"
                elif "recursion_tree" in applicable_methods:
                    default_method = "recursion_tree"
                elif "iteration" in applicable_methods:
                    default_method = "iteration"
                else:
                    default_method = recurrence.get("method", "master")
            else:
                default_method = recurrence.get("method", "master")

            def _is_constant_work(raw_term: Any) -> bool:
                raw = str(raw_term or "").strip().lower().replace(" ", "")
                if raw in {
                    "",
                    "0",
                    "1",
                    "theta(1)",
                    "\\theta(1)",
                    "o(1)",
                    "\\mathcal{o}(1)",
                }:
                    return True
                try:
                    _ = float(raw)
                    return True
                except Exception:
                    return False

            def _strategy_family(rec: Dict[str, Any]) -> Dict[str, Any]:
                rec_type = str(rec.get("type", "") or "")
                if rec_type == "divide_conquer":
                    return {
                        "key": "divide_y_venceras",
                        "label": "Divide y Vencerás",
                        "description": "El problema se parte en subproblemas de tamaño proporcional (n/b), se resuelven recursivamente y luego se combina su costo.",
                    }

                if rec_type == "linear_shift":
                    coefficients = rec.get("coefficients", []) or []
                    g_n = rec.get("g(n)")
                    multi_branch = len(coefficients) > 1 or any((c or 0) > 1 for c in coefficients)
                    if multi_branch:
                        return {
                            "key": "resta_y_seras_vencido",
                            "label": "Resta y Serás Vencido",
                            "description": "Se reduce poco el tamaño y además se duplican/ramifican llamadas, lo que suele disparar el costo (por ejemplo crecimiento exponencial).",
                        }

                    if not _is_constant_work(g_n):
                        return {
                            "key": "resta_y_seras_vencido",
                            "label": "Resta y Serás Vencido",
                            "description": "Se reduce de forma pequeña (n-1, n-k), pero el trabajo adicional por paso no es constante; eso puede degradar a costos cuadráticos o peores.",
                        }

                    return {
                        "key": "resta_y_venceras",
                        "label": "Resta y Vencerás",
                        "description": "Se avanza restando una parte pequeña (n-1, n-k) y se extiende la solución del subproblema previo con trabajo adicional acotado.",
                    }

                return {
                    "key": "desconocida",
                    "label": "Familia no determinada",
                    "description": "No se pudo ubicar la recurrencia en una familia canónica con la información disponible.",
                }

            # Preparar información básica de la recurrencia
            recurrence_info = {
                "type": recurrence.get("type"),
                "form": recurrence.get("form"),
                "applicable": recurrence.get("applicable"),
            }
            recurrence_info["strategy_family"] = _strategy_family(recurrence)

            if recurrence.get("type") == "divide_conquer":
                recurrence_info.update(
                    {
                        "a": recurrence.get("a"),
                        "b": recurrence.get("b"),
                        "f": recurrence.get("f"),
                    }
                )
                recurrence_info["dp_validation"] = self._build_non_dp_validation(
                    "Esta recurrencia es de Divide y Vencerás (T(n)=aT(n/b)+f(n)); conviene resolverla con Teorema Maestro o árbol de recursión antes que con Programación Dinámica."
                )
            elif recurrence.get("type") == "linear_shift":
                recurrence_info.update(
                    {
                        "order": recurrence.get("order"),
                        "shifts": recurrence.get("shifts"),
                        "g(n)": recurrence.get("g(n)"),
                    }
                )

                linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
                if linear_info:
                    recurrence_info["dp_validation"] = self._build_dp_validation(
                        proc_def,
                        recursive_calls,
                        linear_info,
                    )

            return {
                "ok": True,
                "applicable_methods": applicable_methods,
                "default_method": default_method,
                "recurrence_info": recurrence_info,
            }

        except Exception as e:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": f"Error detectando métodos: {str(e)}",
                        "line": None,
                        "column": None,
                    }
                ],
            }

    def _is_constant_work_term(self, raw_term: Any) -> bool:
        """True si el término de trabajo no recursivo equivale a una constante."""
        cleaned = str(raw_term or "").strip().lower().replace(" ", "")
        if cleaned in {
            "",
            "0",
            "1",
            "\\theta(0)",
            "theta(0)",
            "\\theta(1)",
            "theta(1)",
        }:
            return True
        # Constantes numéricas simples.
        try:
            _ = float(cleaned)
            return True
        except Exception:
            return False

    def _is_single_branch_geometric_divide_conquer_recurrence(
        self, recurrence: Dict[str, Any]
    ) -> bool:
        """
        Detecta T(n)=T(n/b)+Theta(1), útil para iteración geométrica (caso de rama única).
        """
        if recurrence.get("type") != "divide_conquer":
            return False
        # Requiere evidencia estructural del AST (una sola llamada recursiva).
        # Sin ProcDef no podemos validar de forma confiable que sea rama única.
        if not isinstance(self.proc_def, dict):
            return False
        try:
            a_val = int(recurrence.get("a", 0))
            b_val = float(recurrence.get("b", 0))
        except Exception:
            return False

        if a_val != 1 or b_val <= 1:
            return False

        try:
            recursive_calls = self._find_recursive_calls(self.proc_def)
        except Exception:
            return False
        if not recursive_calls:
            return False

        return self._is_constant_work_term(recurrence.get("f", "1"))

    def _has_object_field_access_in_recursive_calls(
        self, recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Detecta si las llamadas recursivas usan accesos a campos de objetos
        (ej: raiz.izquierda, raiz.derecha) - típico de BST o árboles binarios.

        Args:
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si alguna llamada recursiva usa accesos a campos de objetos
        """
        for call in recursive_calls:
            args = call.get("args", [])
            for arg in args:
                if self._has_field_access(arg):
                    return True
        return False

    def _node_contains_call_ids(self, node: Any, call_ids: set) -> bool:
        """True si el nodo (o algún descendiente) es uno de los call dicts por identidad."""
        if isinstance(node, dict):
            if id(node) in call_ids:
                return True
            for _k, v in node.items():
                if _k in ("type", "pos"):
                    continue
                if self._node_contains_call_ids(v, call_ids):
                    return True
            return False
        if isinstance(node, list):
            return any(self._node_contains_call_ids(item, call_ids) for item in node)
        return False

    def _recursive_call_inside_for(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        True si alguna llamada recursiva aparece dentro del cuerpo de un FOR.
        Útil para heurística: F(n, pos) con FOR x <- pos TO n y CALL F(..., x+1, ...) → tamaño decrece (n-pos).
        """
        if not recursive_calls:
            return False
        call_ids = {id(c) for c in recursive_calls}
        body = proc_def.get("body") or proc_def.get("block") or {}

        def any_for_contains_calls(node: Any) -> bool:
            if isinstance(node, dict):
                if node.get("type") == "For":
                    for_body = node.get("body")
                    if isinstance(for_body, dict):
                        for_body = for_body.get("body", for_body.get("statements", [])) or []
                    if self._node_contains_call_ids(for_body, call_ids):
                        return True
                for _k, v in node.items():
                    if any_for_contains_calls(v):
                        return True
                return False
            if isinstance(node, list):
                return any(any_for_contains_calls(item) for item in node)
            return False

        return any_for_contains_calls(body)

    def _has_field_access(self, node: Any) -> bool:
        """
        Verifica si un nodo contiene accesos a campos (field access).

        Args:
            node: Nodo del AST

        Returns:
            True si el nodo contiene accesos a campos
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "").lower()

        # Verificar si es un acceso a campo directo
        if node_type == "field":
            return True

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_field_access(item):
                        return True
            elif isinstance(value, dict):
                if self._has_field_access(value):
                    return True

        return False

    def _extract_field_name(self, node: Any) -> Optional[str]:
        """
        Extrae el nombre del campo de un nodo field access.

        Args:
            node: Nodo del AST

        Returns:
            Nombre del campo o None si no es un field access
        """
        if not isinstance(node, dict):
            return None

        node_type = node.get("type", "").lower()

        # Si es un acceso a campo directo
        if node_type == "field":
            field_name = node.get("field", "") or node.get("name", "")
            if field_name:
                return str(field_name).lower()

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    field_name = self._extract_field_name(item)
                    if field_name:
                        return field_name
            elif isinstance(value, dict):
                field_name = self._extract_field_name(value)
                if field_name:
                    return field_name

        return None

    def _find_main_procedure(self, ast: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Encuentra el procedimiento principal en el AST.

        Args:
            ast: AST del programa

        Returns:
            Nodo ProcDef del procedimiento principal o None
        """
        if not isinstance(ast, dict):
            return None

        body = ast.get("body", [])
        for item in body:
            if isinstance(item, dict) and item.get("type") == "ProcDef":
                return item

        return None

    def _find_procedure_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Encuentra un procedimiento por su nombre en el AST.

        Args:
            name: Nombre del procedimiento a buscar

        Returns:
            Nodo ProcDef del procedimiento o None
        """
        if not self.ast or not isinstance(self.ast, dict):
            return None

        body = self.ast.get("body", [])
        for item in body:
            if isinstance(item, dict) and item.get("type") == "ProcDef":
                proc_name = item.get("name", "")
                if proc_name and proc_name.lower() == name.lower():
                    return item

        return None

    def _validate_conditions(self, proc_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida que el algoritmo cumple condiciones para Teorema Maestro.

        Args:
            proc_def: Nodo ProcDef del procedimiento

        Returns:
            {"valid": bool, "reason": str}
        """
        # Por ahora, validación básica: debe tener llamadas recursivas
        # La validación completa se hace durante la extracción
        has_recursive_calls = self._has_recursive_calls(proc_def)

        if not has_recursive_calls:
            return {"valid": False, "reason": "No se detectaron llamadas recursivas"}

        return {"valid": True, "reason": ""}

    def _has_recursive_calls(self, proc_def: Dict[str, Any]) -> bool:
        """
        Verifica si el procedimiento tiene llamadas recursivas.

        Args:
            proc_def: Nodo ProcDef

        Returns:
            True si tiene llamadas recursivas
        """
        proc_name = proc_def.get("name", "")
        if not proc_name:
            return False

        body = proc_def.get("body", {})
        return self._search_recursive_calls(body, proc_name)

    def _search_recursive_calls(self, node: Any, proc_name: str) -> bool:
        """
        Busca recursivamente llamadas a proc_name en el árbol.

        Args:
            node: Nodo del AST
            proc_name: Nombre del procedimiento

        Returns:
            True si encuentra una llamada recursiva
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        # Verificar si es una llamada al mismo procedimiento
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                return True

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._search_recursive_calls(item, proc_name):
                        return True
            elif isinstance(value, dict):
                if self._search_recursive_calls(value, proc_name):
                    return True

        return False

    def _extract_recurrence(
        self, proc_def: Dict[str, Any], preferred_method: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extrae la recurrencia T(n) = a·T(n/b) + f(n) del procedimiento.

        Args:
            proc_def: Nodo ProcDef del procedimiento
            preferred_method: Método preferido (opcional)

        Returns:
            {"success": bool, "recurrence": dict, "reason": str}
        """
        self.proof_steps.append(
            {"id": "extract", "text": "\\text{Iniciando extracción de recurrencia}"}
        )

        # 1. Encontrar todas las llamadas recursivas
        recursive_calls = self._find_recursive_calls(proc_def)

        if not recursive_calls:
            return {"success": False, "reason": "No se encontraron llamadas recursivas"}

        self.proof_steps.append(
            {
                "id": "extract",
                "text": f"\\text{{Encontradas }} {len(recursive_calls)} \\text{{ llamadas recursivas}}",
            }
        )

        # 2. Analizar tamaños de subproblemas
        # Primero intentar con decrease-and-conquer (para método de iteración)
        subproblem_sizes = []
        for call in recursive_calls:
            # Intentar primero detectar decrease-and-conquer (n-1, n-k), división o MOD (Euclides)
            subproblem_info = self._analyze_subproblem_type(call, proc_def)
            if subproblem_info and subproblem_info["type"] in [
                "subtraction",
                "division",
                "mod",
            ]:
                # Para decrease-and-conquer, crear estructura compatible
                factor = subproblem_info.get("factor", 1)
                pattern = subproblem_info.get("pattern", "n-1")
                # Para decrease-and-conquer, no usamos "b" tradicional
                # En su lugar, almacenamos la información en el subproblem_size
                entry = {
                    "type": subproblem_info["type"],
                    "pattern": pattern,
                    "factor": factor,
                }
                # Para division (ej: BST con raiz.izquierda/derecha → n/2), añadir "b" para divide-and-conquer
                if subproblem_info["type"] == "division":
                    entry["b"] = int(factor)
                # Para mod (Euclides): no hay "b" fijo; se resuelve por iteración → Θ(log n)
                subproblem_sizes.append(entry)
            else:
                # Si no es decrease-and-conquer, intentar divide-and-conquer
                size_info = self._analyze_subproblem_size(call, proc_def)
                if size_info:
                    subproblem_sizes.append(size_info)

        # Si no se pudieron determinar tamaños, verificar si es un caso con objetos (BST, árboles, listas enlazadas, etc.)
        if not subproblem_sizes:
            # Verificar si las llamadas recursivas usan accesos a campos de objetos
            has_object_field_access = self._has_object_field_access_in_recursive_calls(
                recursive_calls
            )

            if has_object_field_access:
                # Distinguir entre árboles binarios (divide_conquer) y listas enlazadas (linear_shift)
                # - Árboles: múltiples llamadas con diferentes campos (izquierda/derecha) → divide_conquer
                # - Listas: una sola llamada con un campo (siguiente) → linear_shift (n-1)

                # Contar cuántas llamadas recursivas hay y qué campos usan
                field_names = set()
                for call in recursive_calls:
                    args = call.get("args", [])
                    for arg in args:
                        field_name = self._extract_field_name(arg)
                        if field_name:
                            field_names.add(field_name)

                # Si hay múltiples campos diferentes (ej: izquierda, derecha) → divide_conquer
                # Si hay un solo campo o campos similares (ej: siguiente) → linear_shift
                if len(field_names) > 1 or len(recursive_calls) > 1:
                    # Múltiples campos o múltiples llamadas → probablemente árbol binario (divide_conquer)
                    subproblem_sizes = [
                        {
                            "b": 2,
                            "offset": 0,
                            "type": "division",
                            "heuristic": "object_field_access_tree",
                        }
                    ]
                else:
                    # Un solo campo, una sola llamada → lista enlazada (linear_shift, n-1)
                    subproblem_sizes = [
                        {
                            "type": "subtraction",
                            "pattern": "n-1",
                            "factor": 1,
                            "heuristic": "object_field_access_list",
                        }
                    ]
            else:
                # Heurística: llamada recursiva dentro de FOR (ej: generación de subconjuntos)
                # El rango (n - pos) decrece en cada llamada → tratar como substracción n-1
                if self._recursive_call_inside_for(proc_def, recursive_calls):
                    subproblem_sizes = [
                        {
                            "type": "subtraction",
                            "pattern": "n-1",
                            "factor": 1,
                            "heuristic": "recursive_call_inside_for",
                        }
                    ]
                else:
                    return {
                        "success": False,
                        "reason": "No se pudieron determinar los tamaños de los subproblemas",
                    }
        else:
            # Si la llamada recursiva está dentro de un FOR (generación de subconjuntos), forzar modelo 2^n
            if self._recursive_call_inside_for(proc_def, recursive_calls):
                has_heuristic = any(
                    s.get("heuristic") == "recursive_call_inside_for" for s in subproblem_sizes
                )
                if not has_heuristic:
                    # Override: pudo haberse clasificado como divide_conquer; forzar subtraction + heuristic
                    subproblem_sizes = [
                        {
                            "type": "subtraction",
                            "pattern": "n-1",
                            "factor": 1,
                            "heuristic": "recursive_call_inside_for",
                        }
                    ]
                else:
                    for s in subproblem_sizes:
                        if s.get("type") == "subtraction":
                            s["heuristic"] = "recursive_call_inside_for"
                            break

        # 3. Verificar que todos los subproblemas tienen el mismo tamaño relativo
        # Distinguir entre decrease-and-conquer, divide-and-conquer y solo MOD (Euclides)
        has_subtraction = any(s.get("type") == "subtraction" for s in subproblem_sizes)
        only_mod = (
            not has_subtraction
            and len(subproblem_sizes) >= 1
            and all(s.get("type") == "mod" for s in subproblem_sizes)
        )
        multi_b_terms = None  # (a_i, b_i) para divide-and-conquer generalizado

        if has_subtraction:
            # Para decrease-and-conquer, verificar patrones
            patterns = [
                s.get("pattern") for s in subproblem_sizes if s.get("type") == "subtraction"
            ]

            # Permitir múltiples llamadas recursivas con substracciones (ej: Fibonacci T(n) = T(n-1) + T(n-2))
            # Solo rechazar si hay mezcla de tipos (substracción y división)
            has_mixed_types = any(s.get("type") != "subtraction" for s in subproblem_sizes)

            if has_mixed_types:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["Mezcla de tipos de subproblemas (substracción y división)"],
                    },
                    "reason": "Subproblemas de tipos distintos",
                }

            # Si hay múltiples patrones de substracción, aún se puede resolver con iteración
            # (aunque sea más complejo, como en Fibonacci)
            if not patterns:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["No se pudieron identificar patrones de subproblemas"],
                    },
                    "reason": "Patrones de subproblemas no identificados",
                }

            # Usar un b ficticio para decrease-and-conquer (se usará solo si aplica Teorema Maestro)
            # Para método de iteración, se detectará más adelante
            b = 2  # Valor por defecto, no se usará para decrease-and-conquer
        else:
            # Solo mod (Euclides): T(b, a mod b) → Θ(log n), sin b constante
            if only_mod:
                b = 2  # dummy para que el flujo continúe; se usará método de iteración con resultado log
            else:
                # Para divide-and-conquer, permitir ahora múltiples tamaños de subproblema (b distintos)
                b_values = [s["b"] for s in subproblem_sizes if s.get("b")]
                if not b_values:
                    return {
                        "success": False,
                        "recurrence": {
                            "applicable": False,
                            "notes": ["No se pudieron determinar factores de división (b)"],
                        },
                        "reason": "Tamaños de subproblemas no determinados",
                    }
                unique_b_values = sorted(set(b_values))
                if len(unique_b_values) == 1:
                    # Caso clásico: todos los subproblemas tienen el mismo tamaño n/b
                    b = unique_b_values[0]
                else:
                    # Caso generalizado: múltiples tamaños n/b_i (ej. n/2 y n/4)
                    # Construir términos (a_i, b_i) contando cuántas llamadas tienen cada factor
                    from collections import Counter

                    counts = Counter(b_values)
                    multi_b_terms = [
                        (counts[b_val], self._canonicalize_numeric(b_val))
                        for b_val in unique_b_values
                    ]
                    # Elegir un b representativo solo para mostrar en proof; no se usará en Master
                    b = unique_b_values[0]

        # Evita arrastrar floats innecesarios como 2.0 cuando el factor es exacto.
        b = self._canonicalize_numeric(b)

        # 3.5. Determinar el valor de 'a' considerando ramas mutuamente excluyentes
        # Si las llamadas recursivas están en un IF-ELSE, solo se ejecuta una rama
        a = self._calculate_recursive_calls_count(proc_def, recursive_calls)

        # 4. Calcular f(n) (trabajo no recursivo)
        f_n = self._calculate_non_recursive_work(proc_def, recursive_calls)

        # 5. Detectar caso base n0
        n0 = self._detect_base_case(proc_def)

        # 6. Detectar método apropiado
        # Si se proporciona preferred_method, usarlo directamente y detectar los demás para validación
        if preferred_method:
            # Detectar todos los métodos aplicables para validar que preferred_method es aplicable
            use_characteristic = self._detect_characteristic_equation_method(
                proc_def, recursive_calls
            )
            use_iteration = (
                self._detect_iteration_method(proc_def, recursive_calls)
                if not use_characteristic
                else False
            )
            use_recursion_tree = (
                self._detect_recursion_tree_method(proc_def, recursive_calls, a, b)
                if not use_iteration
                else False
            )

            # Forzar el método preferido
            if preferred_method == "characteristic_equation":
                use_characteristic = True
                use_iteration = False
                use_recursion_tree = False
            elif preferred_method == "iteration":
                use_characteristic = False
                use_iteration = True
                use_recursion_tree = False
            elif preferred_method == "recursion_tree":
                use_characteristic = False
                use_iteration = False
                use_recursion_tree = True
            elif preferred_method == "master":
                use_characteristic = False
                use_iteration = False
                use_recursion_tree = False
        else:
            # Detectar método apropiado (PRIORIDAD: Ecuación Característica > Iteración > Árbol > Maestro)
            use_characteristic = self._detect_characteristic_equation_method(
                proc_def, recursive_calls
            )
            use_iteration = False
            use_recursion_tree = False

            if not use_characteristic:
                # Solo considerar Iteración si NO aplica Ecuación Característica
                use_iteration = self._detect_iteration_method(proc_def, recursive_calls)

            if not use_iteration:
                # Solo considerar Árbol de Recursión si no aplica Ecuación Característica ni Iteración
                use_recursion_tree = self._detect_recursion_tree_method(
                    proc_def, recursive_calls, a, b
                )

        # Recursión dentro de FOR (generación de subconjuntos): no usar iteración ni master → usar árbol → Θ(2^n)
        has_recursive_call_inside_for = any(
            s.get("heuristic") == "recursive_call_inside_for" for s in subproblem_sizes
        )
        if not use_characteristic and has_recursive_call_inside_for:
            use_iteration = False
            use_recursion_tree = True

        # Solo MOD (Euclides): forzar método de iteración → Θ(log n)
        if only_mod:
            use_characteristic = False
            use_iteration = True
            use_recursion_tree = False

        # 7. Construir recurrencia con método apropiado
        # Simplificar b para mostrar
        b_str = self._simplify_number_latex(b)
        quicksort_worst_override = False

        # Cuando hay substracción, construir una sola vez la forma lineal para reutilizar en iteración o recursion_tree (branching subset)
        recurrence_form_linear = None
        if has_subtraction:
            from collections import Counter

            term_counts_linear = Counter()
            for s in subproblem_sizes:
                if s.get("type") == "subtraction":
                    p = s.get("pattern", "n-1")
                    term_counts_linear[p] = term_counts_linear.get(p, 0) + 1
            if term_counts_linear:
                f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                if len(term_counts_linear) > 1:
                    terms_latex = " + ".join(
                        [f"T({t})" for t in sorted(term_counts_linear.keys(), reverse=True)]
                    )
                    recurrence_form_linear = f"T(n) = {terms_latex} + {f_n_display}"
                else:
                    pattern, count = list(term_counts_linear.items())[0]
                    if count > 1:
                        recurrence_form_linear = (
                            f"T(n) = {count} \\cdot T({pattern}) + {f_n_display}"
                        )
                    else:
                        recurrence_form_linear = f"T(n) = T({pattern}) + {f_n_display}"

        # Para ecuación característica e iteración, usar desplazamientos constantes (n-1, n-2, etc.)
        if use_characteristic or use_iteration:
            # Usar forma lineal ya construida si existe; si no, construir desde recursive_calls
            if recurrence_form_linear is not None:
                recurrence_form = recurrence_form_linear
            else:
                from collections import Counter

                term_counts = Counter()
                for call in recursive_calls:
                    subproblem_info = self._analyze_subproblem_type(call, proc_def)
                    if subproblem_info and subproblem_info["type"] == "subtraction":
                        pattern = subproblem_info.get("pattern", "n-1")
                        term_counts[pattern] += 1
                if len(term_counts) > 1:
                    terms_latex = " + ".join(
                        [f"T({term})" for term in sorted(term_counts.keys(), reverse=True)]
                    )
                    f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                    recurrence_form = f"T(n) = {terms_latex} + {f_n_display}"
                elif len(term_counts) == 1:
                    pattern, count = list(term_counts.items())[0]
                    f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                    if count > 1:
                        recurrence_form = f"T(n) = {count} \\cdot T({pattern}) + {f_n_display}"
                    else:
                        recurrence_form = f"T(n) = T({pattern}) + {f_n_display}"
                else:
                    subproblem_info = self._analyze_subproblem_type(recursive_calls[0], proc_def)
                    f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                    if subproblem_info:
                        pattern = subproblem_info.get("pattern", "n-1")
                        recurrence_form = f"T(n) = T({pattern}) + {f_n_display}"
                    else:
                        recurrence_form = f"T(n) = T(n-1) + {f_n_display}"
        else:
            # Para divide-and-conquer (Teorema Maestro o Árbol de Recursión)
            # Recursión dentro de FOR (branching subset): usar forma lineal ya construida
            quicksort_worst_override = (
                use_recursion_tree
                and preferred_method == "recursion_tree"
                and self._detect_quicksort_pivot_izq(proc_def)
            )
            if has_recursive_call_inside_for and recurrence_form_linear is not None:
                recurrence_form = recurrence_form_linear
            elif quicksort_worst_override:
                recurrence_form = "T(n) = T(n-1) + n"
            else:
                # Caso general: construir forma T(n) = sum a_i T(n/b_i) + f(n)
                if multi_b_terms:
                    terms_latex = []
                    for coeff, b_val in multi_b_terms:
                        coeff_str = "" if coeff == 1 else f"{coeff} \\cdot "
                        b_part = self._simplify_number_latex(b_val)
                        terms_latex.append(f"{coeff_str}T(n/{b_part})")
                    terms_str = " + ".join(terms_latex) if terms_latex else "T(n)"
                    recurrence_form = f"T(n) = {terms_str} + f(n)"
                else:
                    recurrence_form = f"T(n) = {a} \\cdot T(n/{b_str}) + f(n)"

        # Determinar método a usar (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if use_characteristic:
            method = "characteristic_equation"
        elif use_iteration:
            method = "iteration"
        elif use_recursion_tree:
            method = "recursion_tree"
        elif multi_b_terms:
            # Divide-and-conquer con múltiples tamaños de subproblema: usar árbol generalizado
            method = "recursion_tree"
        else:
            method = "master"

        # Construir recurrencia según el método
        if method == "characteristic_equation":
            # Para ecuación característica, usar estructura linear_shift (sin a/b)
            # Obtener información de desplazamientos y coeficientes
            linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
            if linear_info:
                coefficients = linear_info["coefficients"]
                max_offset = linear_info["max_offset"]
                g_n_str = linear_info["g_n"]

                # Construir forma correcta para ecuación característica: T(n) = T(n-1) + T(n-2) + g(n)
                # Usar g(n) en lugar de f(n), y omitir g(n) si es 0 (homogénea)
                g_n_clean = g_n_str.strip().lower() if g_n_str else ""
                is_homogeneous = (
                    g_n_clean == "0"
                    or g_n_clean == "\\theta(0)"
                    or g_n_clean == "theta(0)"
                    or (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0))
                )

                # Construir términos recursivos
                terms_latex = []
                for offset in sorted(coefficients.keys(), reverse=True):
                    coeff = coefficients[offset]
                    if coeff == 1:
                        terms_latex.append(f"T(n-{offset})")
                    else:
                        terms_latex.append(f"{coeff} \\cdot T(n-{offset})")

                # Formar la ecuación de recurrencia
                if is_homogeneous:
                    recurrence_form_corrected = f"T(n) = {' + '.join(terms_latex)}"
                else:
                    recurrence_form_corrected = f"T(n) = {' + '.join(terms_latex)} + g(n)"

                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form_corrected,
                    "order": max_offset,  # orden de la recurrencia (k)
                    "shifts": sorted(coefficients.keys()),  # [1, 2] para Fibonacci
                    "coefficients": [
                        coefficients[shift] for shift in sorted(coefficients.keys())
                    ],  # [1, 1] para Fibonacci
                    "g(n)": "0" if is_homogeneous else (g_n_str if g_n_str else None),
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method,
                }
            else:
                # Fallback si no se puede obtener linear_info
                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form,
                    "g(n)": f_n if f_n != "0" else None,
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method,
                }
        elif method == "iteration":
            # Para método de iteración, verificar si es linear_shift o divide_conquer
            # Si la recurrencia tiene forma T(n) = T(n-k) + f(n) (desplazamiento lineal), es linear_shift
            # Si tiene forma T(n) = a·T(n/b) + f(n) con b > 1, es divide_conquer
            has_subtraction = any(s.get("type") == "subtraction" for s in subproblem_sizes)

            if has_subtraction:
                # Es una recurrencia lineal (linear_shift)
                # Obtener información de desplazamientos y coeficientes
                linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
                if linear_info:
                    coefficients = linear_info["coefficients"]
                    max_offset = linear_info["max_offset"]
                    g_n_str = linear_info["g_n"]

                    # Construir forma correcta para linear_shift
                    terms_latex = []
                    for offset in sorted(coefficients.keys(), reverse=True):
                        coeff = coefficients[offset]
                        if coeff == 1:
                            terms_latex.append(f"T(n-{offset})")
                        else:
                            terms_latex.append(f"{coeff} \\cdot T(n-{offset})")

                    g_n_clean = g_n_str.strip().lower() if g_n_str else ""
                    is_homogeneous = (
                        g_n_clean == "0"
                        or g_n_clean == "\\theta(0)"
                        or g_n_clean == "theta(0)"
                        or (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0))
                    )

                    if is_homogeneous:
                        recurrence_form_linear = f"T(n) = {' + '.join(terms_latex)}"
                    else:
                        # Reemplazar g(n) con el valor real si está disponible
                        g_n_display = g_n_str if g_n_str and g_n_str != "0" else "g(n)"
                        recurrence_form_linear = f"T(n) = {' + '.join(terms_latex)} + {g_n_display}"

                    recurrence = {
                        "type": "linear_shift",
                        "form": recurrence_form_linear,
                        "order": max_offset,
                        "shifts": sorted(coefficients.keys()),
                        "coefficients": [
                            coefficients[shift] for shift in sorted(coefficients.keys())
                        ],
                        "g(n)": ("0" if is_homogeneous else (g_n_str if g_n_str else None)),
                        "n0": n0,
                        "applicable": True,
                        "notes": [],
                        "method": method,
                    }
                else:
                    # Fallback: usar la forma detectada anteriormente
                    # Reemplazar f(n) con el valor real en la forma
                    f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                    recurrence_form_fixed = recurrence_form.replace("f(n)", f_n_display)
                    recurrence = {
                        "type": "linear_shift",
                        "form": recurrence_form_fixed,
                        "order": 1,  # Asumir orden 1 si no se puede detectar
                        "shifts": [1],
                        "coefficients": [1],
                        "g(n)": f_n if f_n != "0" else None,
                        "n0": n0,
                        "applicable": True,
                        "notes": [],
                        "method": method,
                    }
            else:
                # Es divide-and-conquer (aunque se use método de iteración) o solo MOD (Euclides)
                recurrence = {
                    "type": "divide_conquer",
                    "form": recurrence_form,
                    "a": a,
                    "b": b,
                    "f": f_n,
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method,
                }
                if only_mod:
                    recurrence["subproblem_type"] = "mod"
        else:
            # Para otros métodos (master, recursion_tree), usar a, b, f (divide_conquer)
            # O linear_shift si es quicksort worst case override o recursión dentro de FOR (branching subset)
            if quicksort_worst_override:
                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form,
                    "order": 1,
                    "shifts": [1],
                    "coefficients": [1],
                    "g(n)": "n",
                    "n0": n0,
                    "applicable": True,
                    "notes": ["QuickSort con pivot fijo en izq: worst case T(n)=T(n-1)+n"],
                    "method": method,
                }
            elif method == "recursion_tree" and has_recursive_call_inside_for:
                f_n_display = f_n if f_n and f_n != "0" else "\\Theta(1)"
                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form,
                    "order": 1,
                    "shifts": [1],
                    "coefficients": [1],
                    "g(n)": f_n_display,
                    "n0": n0,
                    "applicable": True,
                    "notes": [
                        "Recursión dentro de FOR (generación de subconjuntos), análisis por árbol de recursión"
                    ],
                    "method": method,
                    "branching_subset": True,
                }
            elif method == "recursion_tree" and has_subtraction:
                # Fibonacci-type: T(n) = T(n-1) + T(n-2) + ... (múltiples términos)
                linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
                if linear_info and len(linear_info.get("coefficients", {})) >= 2:
                    coeffs = linear_info["coefficients"]
                    shifts_list = sorted(coeffs.keys())
                    coeffs_list = [coeffs[s] for s in shifts_list]
                    g_n_str = linear_info.get("g_n", "0") or "0"
                    g_n_clean = g_n_str.strip().lower()
                    is_homogeneous = g_n_clean in ("0", "", "\\theta(0)", "theta(0)")
                    terms_latex = []
                    for offset in shifts_list:
                        c = coeffs[offset]
                        terms_latex.append(
                            f"{c} \\cdot T(n-{offset})" if c != 1 else f"T(n-{offset})"
                        )
                    form_linear = f"T(n) = {' + '.join(terms_latex)}" + (
                        "" if is_homogeneous else f" + {g_n_str}"
                    )
                    recurrence = {
                        "type": "linear_shift",
                        "form": form_linear,
                        "order": max(shifts_list),
                        "shifts": shifts_list,
                        "coefficients": coeffs_list,
                        "g(n)": "0" if is_homogeneous else g_n_str,
                        "n0": n0,
                        "applicable": True,
                        "notes": [
                            "Recurrencia multi-término (ej. Fibonacci), árbol con subproblemas superpuestos"
                        ],
                        "method": method,
                    }
                else:
                    recurrence = {
                        "type": "divide_conquer",
                        "form": recurrence_form,
                        "a": a,
                        "b": b,
                        "f": f_n,
                        "n0": n0,
                        "applicable": True,
                        "notes": [],
                        "method": method,
                    }
            elif multi_b_terms:
                # Divide-and-conquer generalizado: múltiples tamaños n/b_i
                recurrence = {
                    "type": "divide_conquer_multi",
                    "form": recurrence_form,
                    "terms": multi_b_terms,
                    "a": a,
                    "f": f_n,
                    "n0": n0,
                    "applicable": True,
                    "notes": [
                        "Subproblemas de tamaños distintos (divide-and-conquer generalizado)"
                    ],
                    "method": method,
                }
            else:
                recurrence = {
                    "type": "divide_conquer",
                    "form": recurrence_form,
                    "a": a,
                    "b": b,
                    "f": f_n,
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method,
                }

        # Simplificar valores para mostrar en proof
        b_display = self._simplify_number_latex(b)
        method_names = {
            "characteristic_equation": "Método de Ecuación Característica",
            "iteration": "Método de Iteración",
            "recursion_tree": "Método de Árbol de Recursión",
            "master": "Teorema Maestro",
        }
        method_name = method_names.get(method, "Teorema Maestro")
        self.proof_steps.append(
            {
                "id": "method",
                "text": f"\\text{{Método detectado: }} \\text{{{method_name}}}",
            }
        )

        # Solo agregar "Parámetros extraídos" si NO es ecuación característica
        # Para ecuación característica, estos parámetros (a, b, f) no son relevantes
        if method != "characteristic_equation":
            if multi_b_terms:
                # Mostrar conjunto de factores de división en lugar de un solo b
                b_set_display = ", ".join(
                    self._simplify_number_latex(term_b) for _, term_b in multi_b_terms
                )
                self.proof_steps.append(
                    {
                        "id": "extract",
                        "text": f"\\text{{Parámetros extraídos: }} a={a}, b \\in \\{{{b_set_display}\\}}, f(n)={f_n}, n_0={n0}",
                    }
                )
            else:
                self.proof_steps.append(
                    {
                        "id": "extract",
                        "text": f"\\text{{Parámetros extraídos: }} a={a}, b={b_display}, f(n)={f_n}, n_0={n0}",
                    }
                )

        return {"success": True, "recurrence": recurrence}

    def _find_recursive_calls(self, proc_def: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Encuentra todas las llamadas recursivas en el procedimiento.

        Args:
            proc_def: Nodo ProcDef

        Returns:
            Lista de nodos Call recursivos
        """
        proc_name = proc_def.get("name", "")
        calls = []
        body = proc_def.get("body", {})
        self._collect_recursive_calls(body, proc_name, calls)
        return calls

    def _collect_recursive_calls(self, node: Any, proc_name: str, calls: List[Dict[str, Any]]):
        """
        Recolecta recursivamente todas las llamadas a proc_name.

        Args:
            node: Nodo del AST
            proc_name: Nombre del procedimiento
            calls: Lista donde agregar las llamadas encontradas
        """
        if not isinstance(node, dict):
            return

        node_type = node.get("type", "")

        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                calls.append(node)

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._collect_recursive_calls(item, proc_name, calls)
            elif isinstance(value, dict):
                self._collect_recursive_calls(value, proc_name, calls)

    def _calculate_recursive_calls_count(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> int:
        """
        Calcula el número real de llamadas recursivas considerando ramas mutuamente excluyentes.

        Si las llamadas recursivas están en un IF-ELSE, solo se ejecuta una por llamada,
        entonces a = 1. Si están en diferentes caminos no mutuamente excluyentes, se suman.
        También detecta el patrón implícito: IF cond THEN RETURN rec; RETURN rec; (siguiente
        statement es el "else" implícito).

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas

        Returns:
            Número efectivo de llamadas recursivas (a)
        """
        if len(recursive_calls) <= 1:
            return len(recursive_calls)

        if not self.procedure_name:
            return len(recursive_calls)

        # 1. Buscar IF-ELSE explícito con llamadas en ambas ramas
        body = proc_def.get("body", {})
        if_else_paths = self._find_if_else_paths(body)

        for if_node in if_else_paths:
            consequent_has_recursive = self._has_recursive_call_in_subtree(
                if_node.get("consequent"), self.procedure_name
            )
            alternate_has_recursive = self._has_recursive_call_in_subtree(
                if_node.get("alternate"), self.procedure_name
            )

            if consequent_has_recursive and alternate_has_recursive:
                return 1

        # 2. Buscar patrón implícito: IF cond THEN RETURN rec; RETURN rec;
        # (IF sin alternate, siguiente statement es RETURN con recursión)
        if self._has_implicit_if_else_pattern(body):
            return 1

        return len(recursive_calls)

    def _find_if_else_paths(self, node: Any) -> List[Dict[str, Any]]:
        """
        Encuentra todos los nodos IF que tienen ramas alternate (IF-ELSE).

        Args:
            node: Nodo del AST donde buscar

        Returns:
            Lista de nodos IF con ramas alternate
        """
        if_nodes = []

        if not isinstance(node, dict):
            return if_nodes

        node_type = node.get("type", "")

        # Si es un IF con alternate, es un IF-ELSE
        if node_type == "If" and node.get("alternate"):
            if_nodes.append(node)

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if_nodes.extend(self._find_if_else_paths(item))
            elif isinstance(value, dict):
                if_nodes.extend(self._find_if_else_paths(value))

        return if_nodes

    def _get_body_statements(self, body_node: Any) -> List[Any]:
        """Obtiene la lista de statements de un body (Block o dict con body)."""
        if not isinstance(body_node, dict):
            return []
        if body_node.get("type") == "Block":
            return body_node.get("body", [])
        return body_node.get("body", [])

    def _is_recursive_return(self, node: Any, proc_name: str) -> bool:
        """True si node es RETURN con llamada recursiva."""
        if not isinstance(node, dict):
            return False
        if node.get("type") == "Return":
            return self._has_recursive_call_in_subtree(node, proc_name)
        return False

    def _consequent_has_recursive_return(self, consequent: Any, proc_name: str) -> bool:
        """True si consequent termina en RETURN con llamada recursiva."""
        if not isinstance(consequent, dict):
            return False
        if consequent.get("type") == "Return":
            return self._has_recursive_call_in_subtree(consequent, proc_name)
        if consequent.get("type") == "Block":
            stmts = consequent.get("body", [])
            if stmts:
                return self._is_recursive_return(stmts[-1], proc_name)
        return False

    def _has_implicit_if_else_pattern(self, body_node: Any) -> bool:
        """
        Detecta patrón IF cond THEN RETURN rec; RETURN rec; (else implícito).
        El siguiente statement del IF es el RETURN alternativo.
        """
        stmts = self._get_body_statements(body_node)
        if len(stmts) < 2 or not self.procedure_name:
            return False
        for i in range(len(stmts) - 1):
            stmt = stmts[i]
            next_stmt = stmts[i + 1]
            if not isinstance(stmt, dict) or not isinstance(next_stmt, dict):
                continue
            if stmt.get("type") == "If" and not stmt.get("alternate"):
                if self._consequent_has_recursive_return(
                    stmt.get("consequent"), self.procedure_name
                ):
                    if self._is_recursive_return(next_stmt, self.procedure_name):
                        return True
        return False

    def _has_recursive_call_in_subtree(self, node: Any, proc_name: str) -> bool:
        """
        Verifica si algún nodo en el subárbol es una llamada recursiva.

        Args:
            node: Nodo del AST donde buscar
            proc_name: Nombre del procedimiento a buscar

        Returns:
            True si encuentra una llamada recursiva en el subárbol
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        # Verificar si este nodo es una llamada recursiva
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                return True

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_recursive_call_in_subtree(item, proc_name):
                        return True
            elif isinstance(value, dict):
                if self._has_recursive_call_in_subtree(value, proc_name):
                    return True

        return False

    def _analyze_subproblem_size(
        self, call: Dict[str, Any], proc_def: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Analiza el tamaño del subproblema en una llamada recursiva.

        Compara los argumentos de la llamada con los parámetros originales
        para detectar cómo se reduce el tamaño (divide-and-conquer).

        Args:
            call: Nodo Call recursivo
            proc_def: Nodo ProcDef del procedimiento

        Returns:
            {"b": number, "offset": int} o None si no se puede determinar
        """
        # Obtener parámetros del procedimiento
        params = proc_def.get("params", [])
        if not params:
            return None

        args = call.get("args", [])
        if len(args) < len(params):
            return None

        # Estrategia 1: Buscar división directa en argumentos
        # Ejemplo: mergeSort(A, izq, medio) donde medio = (izq + der) / 2
        # O: mergeSort3Vias(A, izq, tercio1) donde tercio1 = izq + tamaño / 3
        for i, arg in enumerate(args):
            b_value = self._extract_division_factor(arg)
            if b_value and b_value >= 2:  # Asegurar que b >= 2
                return {"b": b_value, "offset": 0}

        # Estrategia 2: Comparar argumentos con parámetros originales
        # Si el procedimiento recibe (A, izq, der) y llamamos con (A, izq, medio)
        # donde medio = (izq + der) / 2, detectar que el rango se divide por 2
        # O si llamamos con (A, izq, tercio1) donde tercio1 = izq + tamaño / 3
        b_value = self._detect_size_reduction_by_comparison(args, params, proc_def)
        if b_value and b_value >= 2:  # Asegurar que b >= 2
            return {"b": b_value, "offset": 0}

        # Estrategia 3: Buscar divisiones indirectas en el cuerpo
        # Para casos como mergeSort3Vias donde se calcula tercio1 = izq + tamaño / 3
        # y luego se llama con (A, izq, tercio1)
        # O para multiplicarMatrices donde se calcula mitad = n / 2
        # y luego se llama con (A11, B11, mitad)
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        b_value = self._detect_indirect_division(body, args, params)
        if b_value and b_value >= 2:  # Asegurar que b >= 2
            return {"b": b_value, "offset": 0}

        # Estrategia 3.5: Si un argumento es un identificador simple (variable),
        # buscar directamente si esa variable se asignó con una división
        # Esto maneja casos donde el argumento es simplemente "mitad" sin estar en una expresión compleja
        for arg in args:
            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "identifier":
                    var_name = arg.get("name") or arg.get("id", "")
                    if var_name:
                        b_value = self._find_variable_division(body, var_name)
                        if b_value and b_value >= 2:
                            return {"b": b_value, "offset": 0}

        # Estrategia 4: Buscar floor/ceil de divisiones
        for arg in args:
            b_value = self._extract_floor_ceil_division(arg)
            if b_value and b_value >= 2:  # Asegurar que b >= 2
                return {"b": b_value, "offset": 0}

        # Estrategia 5: Detectar tamaños variables por reducción de rango
        # Para casos como QuickSort: quicksort(A, izq, pi-1) y quicksort(A, pi+1, der)
        # Los tamaños son variables pero sugerir divide-and-conquer con b=2 (mejor caso)
        # o inferir peor caso si hay patrones de decrease-and-conquer
        b_value = self._detect_variable_size_reduction(args, params, proc_def)
        if b_value and b_value >= 2:
            return {"b": b_value, "offset": 0}

        return None

    def _detect_indirect_division(
        self, body: Any, args: List[Any], params: List[Any]
    ) -> Optional[float]:
        """
        Detecta divisiones indirectas donde los argumentos son variables calculadas con divisiones.

        Ejemplo: En mergeSort3Vias, se calcula tercio1 = izq + tamaño / 3,
        y luego se llama con (A, izq, tercio1). Necesitamos detectar el / 3.

        Args:
            body: Cuerpo del procedimiento donde buscar asignaciones
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento

        Returns:
            Factor b si se encuentra una división indirecta
        """
        if not args or not params:
            return None

        # Buscar argumentos que sean identificadores (variables)
        division_factors = []
        for arg in args:
            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "identifier":
                    var_name = arg.get("name", "") or arg.get("id", "")
                    if var_name:
                        # Buscar si esta variable se asignó con una división
                        b_value = self._find_variable_division(body, var_name)
                        if b_value:
                            division_factors.append(b_value)
                # También buscar divisiones dentro de expresiones binarias
                elif arg_type == "binary":
                    b_value = self._extract_division_factor(arg)
                    if b_value:
                        division_factors.append(b_value)

        # Si encontramos divisiones, usar la más común
        if division_factors:
            from collections import Counter

            counter = Counter(division_factors)
            most_common = counter.most_common(1)[0]
            # Si hay una división dominante (al menos 50% de las divisiones)
            if most_common[1] >= len(division_factors) * 0.5:
                return most_common[0]
            # Si todas las divisiones son iguales, usar ese valor
            if len(set(division_factors)) == 1:
                return division_factors[0]

        return None

    def _detect_size_reduction_by_comparison(
        self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]
    ) -> Optional[float]:
        """
        Detecta reducción de tamaño comparando argumentos con parámetros.

        Busca patrones como:
        - Parámetros: (A, izq, der) → tamaño = der - izq + 1 = n
        - Argumentos: (A, izq, medio) donde medio = (izq + der) / 2
        - Nuevo tamaño = medio - izq + 1 ≈ n/2

        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            proc_def: Nodo ProcDef

        Returns:
            Factor b (n/b) o None
        """
        # Estrategia 1: Buscar asignaciones que calculen divisiones
        # Ejemplo: "medio <- (izq + der) / 2"
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        division_factors = []

        # Buscar asignaciones como "medio <- (izq + der) / 2"
        self._find_division_assignments(body, division_factors)

        if division_factors:
            # Si encontramos divisiones, usar la más común
            from collections import Counter

            counter = Counter(division_factors)
            most_common = counter.most_common(1)[0]
            if most_common[1] >= len(division_factors) * 0.5:  # Al menos 50% de las divisiones
                return most_common[0]

        # Estrategia 2: Analizar los argumentos de las llamadas recursivas
        # Si vemos que los argumentos cambian de manera que sugiere división
        # Por ejemplo: (izq, der) → (izq, medio) donde medio = (izq + der) / 2
        if len(args) >= 2 and len(params) >= 2:
            # Buscar si algún argumento es una variable que se calculó como división
            for arg in args:
                if isinstance(arg, dict):
                    arg_name = arg.get("name") or (
                        arg.get("target", {}).get("name")
                        if isinstance(arg.get("target"), dict)
                        else None
                    )
                    if arg_name:
                        # Buscar si esta variable se asignó con una división
                        b_value = self._find_variable_division(body, arg_name)
                        if b_value:
                            return b_value

        return None

    def _find_variable_division(self, node: Any, var_name: str) -> Optional[float]:
        """
        Busca si una variable se asignó con una división.

        Args:
            node: Nodo del AST donde buscar
            var_name: Nombre de la variable a buscar

        Returns:
            Factor de división o None
        """
        if not isinstance(node, dict):
            return None

        node_type = node.get("type", "")

        # Buscar asignaciones a la variable
        if node_type == "Assign":
            target = node.get("target", {})
            if isinstance(target, dict):
                target_name = target.get("name") or target.get("id", "")
                if target_name and target_name.lower() == var_name.lower():
                    # Verificar si el valor es una división
                    value = node.get("value", {})
                    if isinstance(value, dict):
                        return self._extract_division_factor(value)

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_variable_division(item, var_name)
                    if result:
                        return result
            elif isinstance(value, dict):
                result = self._find_variable_division(value, var_name)
                if result:
                    return result

        return None

    def _find_division_assignments(self, node: Any, factors: List[float]):
        """
        Busca asignaciones que calculen divisiones (como medio <- (izq + der) / 2).

        Args:
            node: Nodo del AST
            factors: Lista donde agregar factores encontrados
        """
        if not isinstance(node, dict):
            return

        node_type = node.get("type", "")

        if node_type == "Assign":
            # Verificar si la asignación es una división
            value = node.get("value", {})
            if isinstance(value, dict):
                b_value = self._extract_division_factor(value)
                if b_value:
                    factors.append(b_value)

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._find_division_assignments(item, factors)
            elif isinstance(value, dict):
                self._find_division_assignments(value, factors)

    def _extract_division_factor(self, expr: Any) -> Optional[float]:
        """
        Extrae el factor de división de una expresión (n/b -> b).

        Maneja casos como:
        - n / 2 → 2
        - n / 3 → 3
        - n / 4 → 4
        - (izq + der) / 2 → 2 (si izq + der representa n)
        - tamaño / 3 → 3
        - (a + b) / c → c (si a + b representa n)
        - izq + tamaño / 3 → 3 (extrae la división dentro de la suma)

        Args:
            expr: Expresión del AST

        Returns:
            Valor de b o None
        """
        if not isinstance(expr, dict):
            return None

        expr_type = expr.get("type", "").lower()

        if expr_type == "binary":
            op = expr.get("operator", "") or expr.get("op", "")

            # Si es una división directa: expr / constante
            if op == "/" or op == "div":
                left = expr.get("left", {}) or expr.get("lhs", {})
                right = expr.get("right", {}) or expr.get("rhs", {})

                # Verificar si right es un número constante
                if isinstance(right, dict):
                    right_type = right.get("type", "").lower()
                    if right_type in ["number", "literal"]:
                        try:
                            b = self._canonicalize_numeric(right.get("value", 0))
                            if b > 0:
                                # Verificar que left sea una expresión que represente n
                                # (puede ser un identificador, suma, etc.)
                                if self._represents_size_variable(left):
                                    return b
                        except Exception:
                            pass
                    # También verificar si right es un número directo
                    elif isinstance(right, (int, float)):
                        if right > 0:
                            if self._represents_size_variable(left):
                                return self._canonicalize_numeric(right)
                    # También verificar si right es una expresión constante evaluable
                    elif right_type == "binary":
                        # Intentar evaluar la expresión del divisor
                        try:
                            # Convertir a SymPy y evaluar si es constante
                            right_expr = self.expr_converter.ast_to_sympy(right)
                            # Si no tiene variables, es constante
                            if not right_expr.free_symbols:
                                b = self._canonicalize_numeric(right_expr.evalf())
                                if b > 0 and self._represents_size_variable(left):
                                    return b
                        except Exception:
                            pass
                # También verificar si right es un número directo (no dict)
                elif isinstance(right, (int, float)):
                    if right > 0:
                        if self._represents_size_variable(left):
                            return self._canonicalize_numeric(right)

            # Si es una suma o resta, buscar divisiones dentro de ella
            # Ejemplo: izq + tamaño / 3 → buscar / 3 dentro de la expresión
            elif op in ["+", "-"]:
                left = expr.get("left", {}) or expr.get("lhs", {})
                right = expr.get("right", {}) or expr.get("rhs", {})

                # Buscar división en el lado izquierdo
                if isinstance(left, dict):
                    b_value = self._extract_division_factor(left)
                    if b_value:
                        return b_value

                # Buscar división en el lado derecho
                if isinstance(right, dict):
                    b_value = self._extract_division_factor(right)
                    if b_value:
                        return b_value

        return None

    def _represents_size_variable(self, expr: Any) -> bool:
        """
        Verifica si una expresión representa el tamaño n del problema.

        Args:
            expr: Expresión del AST

        Returns:
            True si representa n (o una expresión que incluye n)
        """
        if not isinstance(expr, dict):
            return False

        expr_type = expr.get("type", "").lower()

        # Identificador que podría ser n o un parámetro de tamaño
        if expr_type == "identifier":
            name = expr.get("name", "").lower()
            # Parámetros comunes que representan tamaño
            if name in [
                "n",
                "size",
                "length",
                "tamaño",
                "tamanio",
                "der",
                "end",
                "high",
                "fin",
            ]:
                return True
            # También podría ser izq + der que representa el rango
            return True  # Por ahora, asumir que cualquier identificador puede ser tamaño

        # Suma/resta que podría representar un rango (der - izq + 1, etc.)
        if expr_type == "binary":
            op = expr.get("operator", "") or expr.get("op", "")
            if op in ["+", "-"]:
                left = expr.get("left", {})
                right = expr.get("right", {})
                # Si es una suma/resta de parámetros, probablemente representa tamaño
                if (isinstance(left, dict) and left.get("type", "").lower() == "identifier") or (
                    isinstance(right, dict) and right.get("type", "").lower() == "identifier"
                ):
                    return True

        return False

    def _detect_quicksort_pivot_izq(self, proc_def: Dict[str, Any]) -> bool:
        """
        Detecta QuickSort con pivot fijo en el inicio (pivot <- izq).
        En worst case (array ordenado), una partición queda vacía: T(n)=T(n-1)+n.
        """

        def _search_assign(node: Any) -> bool:
            if not isinstance(node, dict):
                return False
            if node.get("type", "").lower() == "assign":
                target = node.get("target", {})
                value = node.get("value", {})
                if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                    tname = (target.get("name") or "").lower()
                    if tname in ["pivot", "pivote", "pi"]:
                        if (
                            isinstance(value, dict)
                            and value.get("type", "").lower() == "identifier"
                        ):
                            vname = (value.get("name") or "").lower()
                            if vname in [
                                "izq",
                                "izquierda",
                                "left",
                                "inicio",
                                "start",
                                "low",
                            ]:
                                return True
            for key in ["body", "consequent", "alternate", "then"]:
                child = node.get(key)
                if isinstance(child, dict) and _search_assign(child):
                    return True
                if isinstance(child, list):
                    for item in child:
                        if _search_assign(item):
                            return True
            return False

        return _search_assign(proc_def.get("body", {}))

    def _detect_variable_size_reduction(
        self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]
    ) -> Optional[float]:
        """
        Detecta reducción de tamaño variable para casos como QuickSort.

        Para QuickSort: quicksort(A, izq, pi-1) y quicksort(A, pi+1, der)
        Los tamaños son variables pero podemos inferir divide-and-conquer con b=2
        (mejor caso) basándonos en que hay dos llamadas recursivas.

        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            proc_def: Nodo ProcDef

        Returns:
            Factor b estimado (típicamente 2 para divide-and-conquer) o None
        """
        if not args or not params:
            return None

        # Para QuickSort y algoritmos similares, los argumentos suelen ser:
        # - Primer argumento: el mismo array/estructura
        # - Argumentos siguientes: expresiones aritméticas que reducen el rango

        # Verificar si los argumentos son expresiones aritméticas (resta/suma)
        # que sugieren división del rango
        has_arithmetic_expressions = False
        for i, arg in enumerate(args):
            if i == 0:
                continue  # Saltar el primer argumento (array/estructura)

            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "binary":
                    op = arg.get("op", "")
                    # Si hay expresiones con + o -, sugiere manipulación del rango
                    if op in ["+", "-"]:
                        has_arithmetic_expressions = True
                        break

        # Si encontramos expresiones aritméticas que modifican el rango,
        # y el procedimiento tiene múltiples llamadas recursivas,
        # inferir que es divide-and-conquer con b=2 (mejor caso común)
        if has_arithmetic_expressions:
            # Verificar si hay múltiples llamadas recursivas (divide-and-conquer)
            recursive_calls = self._find_recursive_calls(proc_def)
            if len(recursive_calls) >= 2:
                # QuickSort y algoritmos similares típicamente dividen por 2
                return 2

        return None

    def _extract_floor_ceil_division(self, expr: Any) -> Optional[float]:
        """
        Extrae el factor de división de floor(n/b) o ceil(n/b).

        Args:
            expr: Expresión del AST

        Returns:
            Valor de b o None
        """
        if not isinstance(expr, dict):
            return None

        # Por ahora, simplificado: buscar divisiones dentro de unary/function calls
        # En el futuro, se puede mejorar para detectar floor/ceil explícitos

        return None

    def _calculate_non_recursive_work(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> str:
        """
        Calcula f(n) como el trabajo no recursivo por activación.

        Analiza el código no recursivo para determinar su complejidad:
        - Si hay bucles que iteran sobre n → f(n) = Θ(n)
        - Si hay bucles anidados → f(n) = Θ(n²)
        - Si hay llamadas a funciones auxiliares (como merge) → f(n) = Θ(n) típicamente
        - Si solo hay operaciones constantes → f(n) = Θ(1)

        Args:
            proc_def: Nodo ProcDef
            recursive_calls: Lista de llamadas recursivas

        Returns:
            Expresión de f(n) en formato LaTeX
        """
        body = proc_def.get("body", {}) or proc_def.get("block", {})

        # Analizar la complejidad del trabajo no recursivo
        work_complexity = self._analyze_work_complexity(body, recursive_calls)

        # Si hay llamadas a funciones auxiliares (como merge) sin definición en el AST,
        # _analyze_work_complexity devuelve "1". En divide-and-conquer es común que la
        # combinación sea lineal en el tamaño del subproblema. Heurística genérica: si
        # existe al menos una llamada auxiliar y el trabajo calculado es constante, usar "n".
        if work_complexity in ("1", "0") or not work_complexity:
            if self._has_auxiliary_function_calls(body, recursive_calls):
                return "n"
        return work_complexity or "1"

    def _has_auxiliary_function_calls(
        self, node: Any, recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Verifica si hay llamadas a funciones auxiliares (no recursivas).

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir

        Returns:
            True si hay llamadas auxiliares
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        # Verificar si es una llamada
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            # Si no es recursiva, es auxiliar
            if call_name and call_name.lower() != (self.procedure_name or "").lower():
                return True

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_auxiliary_function_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_auxiliary_function_calls(value, recursive_calls):
                    return True

        return False

    def _analyze_work_complexity(
        self,
        node: Any,
        recursive_calls: List[Dict[str, Any]],
        visited_aux_procs: Optional[Set[str]] = None,
    ) -> str:
        """
        Analiza la complejidad del trabajo no recursivo.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir

        Returns:
            Expresión de complejidad en LaTeX (n, n^2, 1, 0, etc.)
        """
        if not isinstance(node, dict):
            return "1"

        node_type = node.get("type", "")

        if visited_aux_procs is None:
            visited_aux_procs = set()

        # Manejar llamadas a funciones
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name:
                # Si es recursiva, no cuenta trabajo
                if call_name.lower() == (self.procedure_name or "").lower():
                    return "0"  # No cuenta trabajo recursivo
                # Si es una función auxiliar, buscar su definición y analizar su complejidad
                else:
                    call_key = call_name.strip().lower()
                    if call_key in visited_aux_procs:
                        # Evitar ciclos/auto-recursión en funciones auxiliares (p.ej. bitonicMerge).
                        # Para extracción de recurrencia, degradamos de forma conservadora a O(1)
                        # en vez de reventar con RecursionError.
                        return "1"
                    aux_proc = self._find_procedure_by_name(call_name)
                    if aux_proc:
                        # Analizar la complejidad de la función auxiliar
                        visited_aux_procs.add(call_key)
                        try:
                            aux_complexity = self._analyze_work_complexity(
                                aux_proc.get("body", {}),
                                recursive_calls,
                                visited_aux_procs,
                            )
                            return aux_complexity
                        finally:
                            visited_aux_procs.discard(call_key)
                    # Si no se encuentra la definición, asumir O(1) por defecto
                    return "1"

        # Detectar RETURN que solo contiene operaciones básicas con llamadas recursivas
        # En ese caso, el trabajo es 0 (homogénea)
        if node_type == "Return":
            value = node.get("value", {})
            if isinstance(value, dict):
                value_type = value.get("type", "")
                # Si el return es solo una suma/resta de llamadas recursivas, trabajo = 0
                if value_type == "Binary" and value.get("op") in ["+", "-", "*", "/"]:
                    left = value.get("left", {})
                    right = value.get("right", {})
                    # Verificar si ambos lados son llamadas recursivas
                    left_is_recursive = (
                        isinstance(left, dict)
                        and left.get("type") == "Call"
                        and (left.get("name") or left.get("callee", "")).lower()
                        == (self.procedure_name or "").lower()
                    )
                    right_is_recursive = (
                        isinstance(right, dict)
                        and right.get("type") == "Call"
                        and (right.get("name") or right.get("callee", "")).lower()
                        == (self.procedure_name or "").lower()
                    )
                    # Si ambos lados son recursivos, trabajo = 0 (homogénea)
                    # PERO si hay trabajo no recursivo (acceso a arrays, variables, etc.), hay trabajo
                    if left_is_recursive and right_is_recursive:
                        # Solo suma/resta de llamadas recursivas, trabajo = 0 (homogénea)
                        return "0"
                    # Si hay al menos un lado que NO es recursivo, hay trabajo no recursivo
                    # Analizar el lado no recursivo para determinar su complejidad
                    if left_is_recursive and not right_is_recursive:
                        # El lado derecho tiene trabajo no recursivo
                        right_complexity = self._analyze_work_complexity(
                            right, recursive_calls, visited_aux_procs
                        )
                        # Si el análisis devuelve "0", significa que no detectó trabajo, pero sabemos que hay trabajo
                        # (porque no es recursivo), así que devolvemos "1" como mínimo
                        return right_complexity if right_complexity != "0" else "1"
                    elif right_is_recursive and not left_is_recursive:
                        # El lado izquierdo tiene trabajo no recursivo
                        left_complexity = self._analyze_work_complexity(
                            left, recursive_calls, visited_aux_procs
                        )
                        # Si el análisis devuelve "0", significa que no detectó trabajo, pero sabemos que hay trabajo
                        # (porque no es recursivo), así que devolvemos "1" como mínimo
                        return left_complexity if left_complexity != "0" else "1"
                    # Si ninguno es recursivo, ambos tienen trabajo
                    elif not left_is_recursive and not right_is_recursive:
                        left_complexity = self._analyze_work_complexity(
                            left, recursive_calls, visited_aux_procs
                        )
                        right_complexity = self._analyze_work_complexity(
                            right, recursive_calls, visited_aux_procs
                        )
                        return self._max_complexity(left_complexity, right_complexity)
                # Si no es Binary, analizar recursivamente el valor
                else:
                    return self._analyze_work_complexity(value, recursive_calls, visited_aux_procs)

        max_complexity = "1"  # Por defecto, constante

        # Detectar acceso a arrays (Index) - tiene trabajo constante O(1)
        # IMPORTANTE: Verificar esto ANTES de procesar otros tipos de nodos
        if node_type == "Index" or node_type.lower() == "index" or node_type == "ArrayAccess":
            # Acceso a array es O(1)
            return "1"

        # Detectar identificadores y literales - operaciones básicas O(1)
        if node_type in ["Identifier", "Number", "Literal"]:
            # Operaciones básicas son O(1)
            return "1"

        # Detectar operaciones binarias simples (sin bucles) - O(1)
        # PERO: Si contiene llamadas recursivas, no cuenta como trabajo
        if node_type == "Binary":
            node.get("op", "")
            left = node.get("left", {})
            right = node.get("right", {})

            # Verificar si alguno de los lados es una llamada recursiva
            left_is_recursive = (
                isinstance(left, dict)
                and left.get("type") == "Call"
                and (left.get("name") or left.get("callee", "")).lower()
                == (self.procedure_name or "").lower()
            )
            right_is_recursive = (
                isinstance(right, dict)
                and right.get("type") == "Call"
                and (right.get("name") or right.get("callee", "")).lower()
                == (self.procedure_name or "").lower()
            )

            # Si ambos lados son recursivos, no hay trabajo no recursivo
            if left_is_recursive and right_is_recursive:
                return "0"

            # Si hay al menos un lado no recursivo, analizar recursivamente
            # para determinar la complejidad del trabajo no recursivo
            if left_is_recursive and not right_is_recursive:
                # El lado derecho tiene trabajo no recursivo
                right_complexity = self._analyze_work_complexity(
                    right, recursive_calls, visited_aux_procs
                )
                return right_complexity if right_complexity != "0" else "1"
            elif right_is_recursive and not left_is_recursive:
                # El lado izquierdo tiene trabajo no recursivo
                left_complexity = self._analyze_work_complexity(
                    left, recursive_calls, visited_aux_procs
                )
                return left_complexity if left_complexity != "0" else "1"
            elif not left_is_recursive and not right_is_recursive:
                # Ambos lados tienen trabajo no recursivo
                left_complexity = self._analyze_work_complexity(
                    left, recursive_calls, visited_aux_procs
                )
                right_complexity = self._analyze_work_complexity(
                    right, recursive_calls, visited_aux_procs
                )
                return self._max_complexity(left_complexity, right_complexity)

            # Si no se puede determinar, asumir O(1) para operaciones básicas
            return "1"

        # Manejar IF: analizar tanto consequent como alternate
        # El trabajo no recursivo puede estar en cualquiera de las ramas
        if node_type == "If":
            consequent = node.get("consequent", {})
            alternate = node.get("alternate", {})

            consequent_complexity = "0"
            alternate_complexity = "0"

            if isinstance(consequent, dict):
                consequent_complexity = self._analyze_work_complexity(
                    consequent, recursive_calls, visited_aux_procs
                )

            if isinstance(alternate, dict):
                alternate_complexity = self._analyze_work_complexity(
                    alternate, recursive_calls, visited_aux_procs
                )

            # El trabajo no recursivo es el máximo entre ambas ramas
            return self._max_complexity(consequent_complexity, alternate_complexity)

        # Buscar bucles FOR
        if node_type == "For":
            # Analizar el rango del bucle
            start = node.get("start", {})
            end = node.get("end", {})

            # Si el rango depende de n (parámetros del procedimiento), es O(n)
            if self._depends_on_size_variable(start, end):
                max_complexity = "n"
            else:
                max_complexity = "1"

        # Buscar bucles WHILE y REPEAT
        if node_type in ["While", "Repeat"]:
            # Si hay un bucle WHILE/REPEAT, probablemente itera sobre alguna variable
            # Si la condición incluye comparaciones con parámetros (como medio, fin, n, etc.), es O(n)
            test = node.get("test", {}) or node.get("condition", {})
            if self._while_depends_on_size(test):
                max_complexity = "n"

        # Buscar bucles anidados
        if node_type in ["For", "While", "Repeat"]:
            # Verificar si hay bucles anidados dentro
            body = node.get("body", {})
            nested_complexity = self._check_nested_loops(body, recursive_calls)
            if nested_complexity == "n^2":
                max_complexity = "n^2"
            elif nested_complexity == "n" and max_complexity == "1":
                max_complexity = "n"

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    child_complexity = self._analyze_work_complexity(
                        item, recursive_calls, visited_aux_procs
                    )
                    max_complexity = self._max_complexity(max_complexity, child_complexity)
            elif isinstance(value, dict):
                child_complexity = self._analyze_work_complexity(
                    value, recursive_calls, visited_aux_procs
                )
                max_complexity = self._max_complexity(max_complexity, child_complexity)

        return max_complexity

    def _depends_on_size_variable(self, start: Any, end: Any) -> bool:
        """
        Verifica si un rango de bucle depende de la variable de tamaño n.

        Args:
            start: Expresión de inicio
            end: Expresión de fin

        Returns:
            True si depende de n
        """
        # Verificar si start o end son parámetros que representan tamaño
        if isinstance(start, dict):
            start_type = start.get("type", "").lower()
            if start_type == "identifier":
                name = start.get("name", "").lower()
                if name in ["izq", "left", "start", "begin"]:
                    # Si el inicio es un parámetro, probablemente el fin también lo es
                    return True

        if isinstance(end, dict):
            end_type = end.get("type", "").lower()
            if end_type == "identifier":
                name = end.get("name", "").lower()
                if name in ["der", "right", "end", "n", "size", "length"]:
                    return True

        return False

    def _while_depends_on_size(self, test: Any) -> bool:
        """
        Verifica si un bucle WHILE/REPEAT depende de variables de tamaño.

        Args:
            test: Condición del bucle (test o condition)

        Returns:
            True si la condición depende de variables de tamaño (medio, fin, n, etc.)
        """
        if not isinstance(test, dict):
            return False

        node_type = test.get("type", "").lower()

        # Si es una comparación binaria (<=, <, >=, >, =, etc.)
        if node_type in ["binary", "binaryop"]:
            left = test.get("left", {})
            right = test.get("right", {})

            # Verificar si alguno de los lados es un parámetro de tamaño
            size_params = [
                "medio",
                "fin",
                "end",
                "n",
                "size",
                "length",
                "inicio",
                "start",
            ]

            def is_size_param(node):
                if not isinstance(node, dict):
                    return False
                if node.get("type", "").lower() == "identifier":
                    name = node.get("name", "").lower()
                    return name in size_params
                return False

            if is_size_param(left) or is_size_param(right):
                return True

            # Verificar recursivamente en expresiones compuestas
            if isinstance(left, dict):
                if self._while_depends_on_size(left):
                    return True
            if isinstance(right, dict):
                if self._while_depends_on_size(right):
                    return True

        # Si es una operación lógica (AND, OR), verificar ambos lados
        if node_type in ["logical", "logicalop"]:
            left = test.get("left", {})
            right = test.get("right", {})
            return self._while_depends_on_size(left) or self._while_depends_on_size(right)

        return False

    def _check_nested_loops(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> str:
        """
        Verifica si hay bucles anidados en el nodo.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas

        Returns:
            "n^2" si hay bucles anidados, "n" si hay un bucle, "1" si no hay
        """
        if not isinstance(node, dict):
            return "1"

        node_type = node.get("type", "")
        has_loop = False

        if node_type in ["For", "While", "Repeat"]:
            has_loop = True
            # Verificar si hay otro bucle dentro
            body = node.get("body", {})
            if self._has_loop_inside(body, recursive_calls):
                return "n^2"

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    nested = self._check_nested_loops(item, recursive_calls)
                    if nested == "n^2":
                        return "n^2"
                    if nested == "n":
                        has_loop = True
            elif isinstance(value, dict):
                nested = self._check_nested_loops(value, recursive_calls)
                if nested == "n^2":
                    return "n^2"
                if nested == "n":
                    has_loop = True

        return "n" if has_loop else "1"

    def _has_loop_inside(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si hay un bucle dentro del nodo.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si hay un bucle
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")
        if node_type in ["For", "While", "Repeat"]:
            return True

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_loop_inside(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_loop_inside(value, recursive_calls):
                    return True

        return False

    def _max_complexity(self, c1: str, c2: str) -> str:
        """
        Retorna la complejidad máxima entre dos.

        Orden: 1 < n < n^2 < n^3 < ...

        Args:
            c1: Primera complejidad
            c2: Segunda complejidad

        Returns:
            La complejidad máxima
        """
        if c1 == "0" or c2 == "0":
            return c1 if c1 != "0" else c2

        # Extraer exponentes
        def get_exponent(c: str) -> int:
            if c == "1":
                return 0
            if c == "n":
                return 1
            if "^" in c:
                try:
                    exp_str = c.split("^")[1]
                    return int(exp_str)
                except Exception:
                    return 1
            return 1

        exp1 = get_exponent(c1)
        exp2 = get_exponent(c2)

        if exp1 >= exp2:
            return c1
        else:
            return c2

    def _count_non_recursive_statements(
        self, node: Any, recursive_calls: List[Dict[str, Any]]
    ) -> int:
        """
        Cuenta statements no recursivos.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir

        Returns:
            Número de statements no recursivos
        """
        count = 0

        if not isinstance(node, dict):
            return count

        node_type = node.get("type", "")

        # Excluir llamadas recursivas
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return 0

        # Contar otros tipos de statements
        if node_type in ["Assign", "If", "For", "While", "Repeat", "Return"]:
            count += 1

        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    count += self._count_non_recursive_statements(item, recursive_calls)
            elif isinstance(value, dict):
                count += self._count_non_recursive_statements(value, recursive_calls)

        return count

    def _detect_base_case(self, proc_def: Dict[str, Any]) -> int:
        """
        Detecta el caso base n0 de la recurrencia.

        Args:
            proc_def: Nodo ProcDef

        Returns:
            Valor de n0 (por defecto 1)
        """
        # Buscar guardas como "if n <= 1" o "if n == 0"
        body = proc_def.get("body", {})
        n0 = self._find_base_case_guard(body)
        return n0 if n0 is not None else 1

    def _detect_base_cases(self, proc_def: Dict[str, Any]) -> Dict[str, int]:
        """
        Detecta todos los casos base de la recurrencia desde el AST.

        Extrae casos base como T(0) = 0, T(1) = 1 para Fibonacci.

        Args:
            proc_def: Nodo ProcDef

        Returns:
            Diccionario con casos base: {"T(0)": 0, "T(1)": 1, ...}
        """
        base_cases = {}
        body = proc_def.get("body", {}) or proc_def.get("block", {})

        # Buscar IF statements que sean casos base
        def find_base_case_returns(node: Any) -> None:
            """Busca recursivamente RETURN statements en casos base (IF sin recursión)."""
            if not isinstance(node, dict):
                return

            node_type = node.get("type", "")

            # Si encontramos un IF, verificar si es caso base
            if node_type == "If":
                condition = node.get("test", {}) or node.get("condition", {})
                consequent = node.get("consequent", {})

                # Extraer valor de n de la condición (ej: "n <= 1" → 1)
                n_value = self._extract_base_case_from_condition(condition)

                # Buscar RETURN en el consequent (rama del caso base)
                if n_value is not None:
                    return_value = self._extract_return_value(consequent)
                    # Si el return es el parámetro mismo (ej: RETURN n), usar n_value como valor
                    if return_value is None:
                        # Verificar si el return es el parámetro (ej: RETURN n cuando n <= 1)
                        return_expr = self._find_return_expression(consequent)
                        param_name = self._get_procedure_param_name()
                        if return_expr:
                            return_expr_type = return_expr.get("type", "")
                            # El AST puede usar "Identifier" (mayúscula) o "identifier" (minúscula)
                            if return_expr_type.lower() == "identifier":
                                return_id_name = return_expr.get("name", "")
                                # Si el return es el parámetro mismo (ej: RETURN n)
                                if param_name and return_id_name.lower() == param_name.lower():
                                    # RETURN n significa T(n) = n cuando n <= n_value
                                    # Para Fibonacci con n <= 1: T(0) = 0, T(1) = 1
                                    for i in range(n_value + 1):
                                        base_cases[f"T({i})"] = i
                                    return_value = n_value  # Marcar como procesado

                    if return_value is not None:
                        # Agregar caso base T(n_value) = return_value
                        if f"T({n_value})" not in base_cases:  # Evitar duplicados
                            base_cases[f"T({n_value})"] = return_value

                # También buscar en alternate si existe (para ELSE)
                alternate = node.get("alternate", {})
                if alternate:
                    find_base_case_returns(alternate)

            # Buscar recursivamente en hijos
            for key, value in node.items():
                if key in ["type", "pos"]:
                    continue
                if isinstance(value, list):
                    for item in value:
                        find_base_case_returns(item)
                elif isinstance(value, dict):
                    find_base_case_returns(value)

        find_base_case_returns(body)

        # Si no se detectaron casos base, intentar método alternativo más directo
        if not base_cases:
            # Buscar directamente en el body del procedimiento
            # Para Fibonacci: IF n <= 1 THEN BEGIN RETURN n END
            # El body es un Block que contiene un If
            if isinstance(body, dict):
                if body.get("type") == "Block":
                    statements = body.get("body", [])
                    for stmt in statements:
                        if isinstance(stmt, dict) and stmt.get("type") == "If":
                            condition = stmt.get("test", {}) or stmt.get("condition", {})
                            consequent = stmt.get("consequent", {})
                            n_value = self._extract_base_case_from_condition(condition)
                            if n_value is not None:
                                # Buscar RETURN en el consequent (puede estar dentro de un Block)
                                return_expr = self._find_return_expression(consequent)
                                param_name = self._get_procedure_param_name()
                                if return_expr:
                                    return_expr_type = return_expr.get("type", "")
                                    # El AST puede usar "Identifier" (mayúscula) o "identifier" (minúscula)
                                    if return_expr_type.lower() == "identifier":
                                        return_id_name = return_expr.get("name", "")
                                        if (
                                            param_name
                                            and return_id_name.lower() == param_name.lower()
                                        ):
                                            # RETURN n significa T(n) = n cuando n <= n_value
                                            # Para Fibonacci con n <= 1: T(0) = 0, T(1) = 1
                                            for i in range(n_value + 1):
                                                base_cases[f"T({i})"] = i
                                            break
                else:
                    # Si el body no es un Block, buscar directamente
                    if body.get("type") == "If":
                        condition = body.get("test", {}) or body.get("condition", {})
                        consequent = body.get("consequent", {})
                        n_value = self._extract_base_case_from_condition(condition)
                        if n_value is not None:
                            return_expr = self._find_return_expression(consequent)
                            param_name = self._get_procedure_param_name()
                            if return_expr and return_expr.get("type") == "Identifier":
                                return_id_name = return_expr.get("name", "")
                                if param_name and return_id_name.lower() == param_name.lower():
                                    for i in range(n_value + 1):
                                        base_cases[f"T({i})"] = i

        return base_cases

    def _find_return_expression(self, node: Any) -> Optional[Any]:
        """
        Encuentra la expresión de un RETURN statement.

        Args:
            node: Nodo del AST

        Returns:
            Expresión del return o None
        """
        if not isinstance(node, dict):
            return None

        node_type = node.get("type", "")

        if node_type == "Return":
            return node.get("value", {})

        # Si es un Block, buscar RETURN en su body
        if node_type == "Block":
            body = node.get("body", [])
            for stmt in body:
                if isinstance(stmt, dict) and stmt.get("type") == "Return":
                    return stmt.get("value", {})

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_return_expression(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._find_return_expression(value)
                if result is not None:
                    return result

        return None

    def _extract_return_value(self, node: Any) -> Optional[int]:
        """
        Extrae el valor de un RETURN statement.

        Args:
            node: Nodo del AST (puede ser Block, Return, etc.)

        Returns:
            Valor del return (int) o None
        """
        if not isinstance(node, dict):
            return None

        node_type = node.get("type", "")

        # Si es un RETURN directo
        if node_type == "Return":
            value = node.get("value", {})
            return self._extract_literal_value(value)

        # Si es un Block, buscar RETURN en su body
        if node_type == "Block":
            body = node.get("body", [])
            for stmt in body:
                if isinstance(stmt, dict) and stmt.get("type") == "Return":
                    value = stmt.get("value", {})
                    return self._extract_literal_value(value)

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._extract_return_value(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._extract_return_value(value)
                if result is not None:
                    return result

        return None

    def _extract_literal_value(self, expr: Any) -> Optional[int]:
        """
        Extrae un valor literal de una expresión.

        Args:
            expr: Expresión del AST

        Returns:
            Valor int o None
        """
        if not isinstance(expr, dict):
            # Si es directamente un número
            if isinstance(expr, (int, float)):
                return int(expr)
            return None

        expr_type = expr.get("type", "")

        # Literal o número
        if expr_type in ["Literal", "Number"]:
            value = expr.get("value")
            if isinstance(value, (int, float)):
                return int(value)

        # Identifier (ej: RETURN n cuando n es el parámetro del caso base)
        if expr_type == "Identifier":
            # Si es el mismo nombre del parámetro, no podemos determinar el valor
            # Pero para casos como RETURN n cuando n = 0 o n = 1, sería útil
            # Por ahora, retornamos None y dejamos que el análisis del IF nos dé el valor
            pass

        return None

    def _get_procedure_param_name(self) -> Optional[str]:
        """
        Obtiene el nombre del parámetro del procedimiento.

        Returns:
            Nombre del parámetro o None
        """
        if not self.proc_def:
            return None

        params = self.proc_def.get("params", [])
        if params and len(params) > 0:
            # El primer parámetro es típicamente 'n'
            param = params[0]
            if isinstance(param, dict):
                return param.get("name")
            elif isinstance(param, str):
                return param

        return None

    def _find_base_case_guard(self, node: Any) -> Optional[int]:
        """
        Busca guardas de caso base en el árbol.

        Args:
            node: Nodo del AST

        Returns:
            Valor de n0 o None
        """
        if not isinstance(node, dict):
            return None

        node_type = node.get("type", "")

        if node_type == "If":
            condition = node.get("condition", {})
            n0 = self._extract_base_case_from_condition(condition)
            if n0 is not None:
                return n0

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_base_case_guard(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._find_base_case_guard(value)
                if result is not None:
                    return result

        return None

    def _extract_base_case_from_condition(self, condition: Any) -> Optional[int]:
        """
        Extrae n0 de una condición como "n <= 1", "n == 0", o "fin - inicio <= 1".

        Una condición de caso base es aquella que compara el tamaño del problema con una constante.
        Ejemplos:
        - n <= 1
        - fin - inicio <= 1
        - n == 0

        Args:
            condition: Expresión de condición

        Returns:
            Valor de n0 o None
        """
        if not isinstance(condition, dict):
            return None

        expr_type = condition.get("type", "")
        expr_type_lower = expr_type.lower() if expr_type else ""

        # El AST puede usar "Binary" (mayúscula) o "binary" (minúscula)
        if expr_type_lower == "binary":
            # El operador puede estar en "op" o "operator"
            op = condition.get("op", "") or condition.get("operator", "")
            left = condition.get("left", {})
            right = condition.get("right", {})

            # Verificar si es una comparación con constante
            if op in ["<=", "<", "==", "==="]:
                # Verificar si right es un número
                if isinstance(right, dict):
                    right_type = right.get("type", "")
                    right_type_lower = right_type.lower() if right_type else ""
                    # Aceptar "number", "literal", o "Number", "Literal" (case-insensitive)
                    if right_type_lower in ["number", "literal"]:
                        try:
                            # Intentar obtener el valor, puede estar en "value" o "val"
                            # Usar get con default None y verificar explícitamente para manejar 0
                            n0_value = right.get("value") if "value" in right else right.get("val")
                            if n0_value is not None:
                                n0 = int(float(n0_value))
                                # Verificar que left sea una expresión relacionada con el tamaño del problema
                                # Puede ser: n, fin - inicio, n - 1, etc.
                                if isinstance(left, dict):
                                    left_type = left.get("type", "").lower()

                                    # Si left es un identificador (n, fin, inicio, etc.)
                                    if left_type == "identifier":
                                        return max(1, n0)  # Mínimo 1

                                    # Si left es una expresión binaria, verificar si es una resta/suma
                                    # que representa el tamaño del problema (fin - inicio, n - 1, etc.)
                                    if left_type == "binary":
                                        left_op = left.get("op", "") or left.get("operator", "")
                                        # Resta o suma que representa el tamaño del problema
                                        if left_op in ["-", "+"]:
                                            # Verificar que ambos lados sean identificadores o números
                                            # (representa tamaño: fin - inicio, n - 1, etc.)
                                            left_left = left.get("left", {})
                                            left_right = left.get("right", {})
                                            if isinstance(left_left, dict) and isinstance(
                                                left_right, dict
                                            ):
                                                left_left_type = left_left.get("type", "").lower()
                                                left_right_type = left_right.get("type", "").lower()
                                                # Al menos uno debe ser un identificador (variable)
                                                if (
                                                    left_left_type == "identifier"
                                                    or left_right_type == "identifier"
                                                ):
                                                    return max(1, n0)  # Mínimo 1
                        except (ValueError, TypeError, AttributeError):
                            pass

        return None

    def _apply_master_theorem(self) -> Dict[str, Any]:
        """
        Aplica el Teorema Maestro a la recurrencia extraída.

        Returns:
            {"success": bool, "master": dict, "reason": str}
        """
        if not self.recurrence:
            return {"success": False, "reason": "No hay recurrencia extraída"}

        recurrence_type = self.recurrence.get("type")
        recurrence_form = self.recurrence.get("form", "")
        a_raw = self.recurrence.get("a")
        b_raw = self.recurrence.get("b")
        f_n_str = str(self.recurrence.get("f", "1")).strip() or "1"

        support_code: Optional[str] = None
        if recurrence_type != "divide_conquer":
            support_code = "MASTER_UNSUPPORTED_FORM"

        try:
            a = int(a_raw)
            b = float(b_raw)
            b = self._canonicalize_numeric(b)
        except Exception:
            a = -1
            b = -1.0
            support_code = "MASTER_INVALID_PARAMETERS"

        if support_code is None and (a < 1 or b <= 1):
            support_code = "MASTER_INVALID_PARAMETERS"

        n_sym = Symbol("n", integer=True, positive=True)
        f_expr: Optional[Expr] = None
        p_expr: Expr = Integer(0)
        p_latex = "0"
        reference_growth = "1"
        relation_type = "undetermined"
        case_candidate: Optional[int] = None
        comparison_partial = False
        regularity_holds: Optional[bool] = None
        regularity_note = ""
        theta_worst_avg: Optional[str] = None
        comparison_legacy: Optional[str] = None

        if support_code is None:
            try:
                p_expr = simplify(
                    sympy_log(Integer(a), Integer(int(b) if float(b).is_integer() else b))
                )
                p_latex = self._simplify_latex_expr(latex(p_expr))
                reference_growth = self._format_master_n_power(p_expr)
            except Exception:
                support_code = "MASTER_INTERNAL_ERROR"

        if support_code is None:
            f_expr = self._parse_master_f_expression(f_n_str, n_sym)
            if f_expr is None:
                relation_type = "undetermined"
                comparison_partial = True
            else:
                comparison_data = self._compare_master_growth_structured(f_expr, p_expr, n_sym)
                relation_type = comparison_data["relation_type"]
                case_candidate = comparison_data["case_candidate"]
                comparison_partial = comparison_data["status"] == "partial"
                comparison_data.get("code")
                comparison_legacy = comparison_data.get("comparison")

        # Regularidad solo para caso 3
        if support_code is None and case_candidate == 3 and f_expr is not None:
            regularity = self._check_master_regularity_structured(a, b, f_expr, n_sym)
            regularity_holds = regularity["holds"]
            regularity_note = regularity["note"]
        elif support_code is None:
            regularity_note = "\\text{No requerida}"

        if support_code is None:
            if case_candidate == 1:
                theta_worst_avg = f"\\Theta({reference_growth})"
            elif case_candidate == 2:
                theta_worst_avg = (
                    "\\Theta(\\log n)"
                    if simplify(p_expr).is_zero
                    else f"\\Theta({reference_growth} \\log n)"
                )
            elif case_candidate == 3 and regularity_holds is True:
                theta_worst_avg = f"\\Theta({self._simplify_latex_expr(f_n_str)})"

        # Best-case distinto solo si hay evidencia de poda dependiente de datos
        profile = getattr(self, "expansion_profile", None)
        decision = getattr(self, "case_variability_decision", None)
        has_early_return = bool(
            decision
            and getattr(decision, "kind", None) == "data_dependent_pruning"
            and profile
            and getattr(profile, "calls_before_any_non_base_return", False)
        )
        theta_best: Optional[str]
        if has_early_return:
            theta_best = "\\Theta(1)"
        else:
            theta_best = theta_worst_avg

        if support_code is not None:
            regularity = {"checked": False, "note": self._note("regularity_assumed")}
        elif case_candidate == 3:
            regularity = {
                "checked": regularity_holds is True,
                "note": regularity_note
                or (
                    self._note("regularity_verified")
                    if regularity_holds is True
                    else self._note("regularity_assumed")
                ),
            }
        else:
            regularity = {"checked": False, "note": "No aplica (solo Caso 3)"}

        step_ctx = MasterStepContext(
            locale=self.locale,
            recurrence_form=recurrence_form,
            a=max(a, 0),
            b=(self._canonicalize_numeric(b) if b > 0 else 0),
            f_n=f_n_str,
            p_latex=p_latex,
            reference_growth_latex=reference_growth,
            relation_type=relation_type,
            case_candidate=case_candidate,
            regularity_holds=regularity_holds,
            regularity_note=regularity_note,
            theta=theta_worst_avg,
            support_code=support_code,
            comparison_partial=comparison_partial,
        )
        step_bundle = build_master_step_bundle(step_ctx)

        if comparison_legacy is None:
            comparison_legacy = (
                "smaller"
                if relation_type == "less"
                else (
                    "equal"
                    if relation_type == "equal"
                    else "larger" if relation_type == "greater" else None
                )
            )

        master = {
            "case": (case_candidate if step_bundle.get("overallStatus") != "unsupported" else None),
            "nlogba": reference_growth,
            "comparison": comparison_legacy,
            "regularity": regularity,
            "theta": theta_worst_avg,
            "theta_best": theta_best,
            "has_early_return": has_early_return,
            "step_by_step": step_bundle,
        }

        if theta_worst_avg:
            self.proof_steps.append(
                {
                    "id": "conclude",
                    "text": f"\\text{{Conclusión maestro: }} T(n) = {theta_worst_avg}",
                }
            )
        else:
            self.proof_steps.append(
                {
                    "id": "conclude",
                    "text": "\\text{El Teorema Maestro no cerró una conclusión completa para este caso.}",
                }
            )
        if has_early_return:
            self.proof_steps.append(
                {"id": "conclude_best", "text": "\\text{Mejor caso: } T(n)=\\Theta(1)"}
            )

        return {"success": True, "master": master}

    def _parse_master_f_expression(self, f_n_str: str, n_sym: Symbol) -> Optional[Expr]:
        raw = f_n_str.strip()
        if not raw:
            return Integer(1)
        normalized = raw.replace("^", "**")
        normalized = re.sub(r"\bn\s+log\s*\(?n\)?", "n*log(n)", normalized)
        normalized = re.sub(r"\bn\s*\\log\s*\(?n\)?", "n*log(n)", normalized)
        normalized = re.sub(r"\\b(log)\\s*n\\b", r"\\1(n)", normalized)
        normalized = normalized.replace("\\log", "log")
        normalized = normalized.replace("\\sqrt", "sqrt")
        normalized = normalized.replace("{", "(").replace("}", ")")
        normalized = normalized.replace("\\", "")
        try:
            return simplify(
                sympify(normalized, locals={"n": n_sym, "log": sympy_log, "sqrt": sqrt})
            )
        except Exception:
            return None

    def _compare_master_exponents(self, lhs: Expr, rhs: Expr) -> Optional[int]:
        diff = simplify(lhs - rhs)
        if diff.is_zero:
            return 0
        if diff.is_positive:
            return 1
        if diff.is_negative:
            return -1
        try:
            diff_val = float(diff.evalf(50))
            if diff_val > 0:
                return 1
            if diff_val < 0:
                return -1
            return 0
        except Exception:
            return None

    def _compare_master_growth_structured(
        self, f_expr: Expr, p_expr: Expr, n_sym: Symbol
    ) -> Dict[str, Any]:
        expr = simplify(f_expr)
        from sympy import Wild

        c_wild = Wild("c", exclude=[n_sym])
        alpha_wild = Wild("alpha")
        beta_wild = Wild("beta")
        match = expr.match(c_wild * (n_sym**alpha_wild) * (sympy_log(n_sym) ** beta_wild))
        if not match:
            return {
                "status": "partial",
                "relation_type": "undetermined",
                "case_candidate": None,
                "code": "MASTER_COMPARISON_PARTIAL",
                "comparison": None,
            }

        coeff = simplify(match.get(c_wild, Integer(1)))
        exp = simplify(match.get(alpha_wild, Integer(0)))
        log_power = simplify(match.get(beta_wild, Integer(0)))

        if coeff.has(n_sym):
            return {
                "status": "partial",
                "relation_type": "undetermined",
                "case_candidate": None,
                "code": "MASTER_COMPARISON_PARTIAL",
                "comparison": None,
            }
        if not log_power.is_integer:
            return {
                "status": "partial",
                "relation_type": "undetermined",
                "case_candidate": None,
                "code": "MASTER_COMPARISON_PARTIAL",
                "comparison": None,
            }

        exp_cmp = self._compare_master_exponents(exp, p_expr)
        if exp_cmp is None:
            return {
                "status": "partial",
                "relation_type": "undetermined",
                "case_candidate": None,
                "code": "MASTER_COMPARISON_PARTIAL",
                "comparison": None,
            }

        if exp_cmp < 0:
            return {
                "status": "complete",
                "relation_type": "less",
                "case_candidate": 1,
                "comparison": "smaller",
            }
        if exp_cmp > 0:
            return {
                "status": "complete",
                "relation_type": "greater",
                "case_candidate": 3,
                "comparison": "larger",
            }

        # exp_cmp == 0
        if log_power == 0:
            return {
                "status": "complete",
                "relation_type": "equal",
                "case_candidate": 2,
                "comparison": "equal",
            }

        return {
            "status": "unsupported",
            "relation_type": "intermediate",
            "case_candidate": None,
            "code": "MASTER_INTERMEDIATE_GAP",
            "comparison": None,
        }

    def _check_master_regularity_structured(
        self, a: int, b: float, f_expr: Expr, n_sym: Symbol
    ) -> Dict[str, Any]:
        try:
            b_term = Integer(int(b)) if float(b).is_integer() else b
            ratio_expr = simplify((Integer(a) * f_expr.subs(n_sym, n_sym / b_term)) / f_expr)
        except Exception:
            return {
                "holds": None,
                "note": "\\text{No se pudo construir la razón de regularidad.}",
            }

        if ratio_expr.is_number:
            try:
                ratio_val = float(ratio_expr.evalf(50))
                if ratio_val < 1:
                    return {
                        "holds": True,
                        "note": f"a\\,f(n/b)/f(n)={self._simplify_number_latex(ratio_val)}<1",
                    }
                return {
                    "holds": False,
                    "note": f"a\\,f(n/b)/f(n)={self._simplify_number_latex(ratio_val)}\\ge 1",
                }
            except Exception:
                pass

        try:
            lim = limit(ratio_expr, n_sym, oo)
            if lim.is_number:
                lim_val = float(lim.evalf(50))
                if lim_val < 1:
                    return {
                        "holds": True,
                        "note": f"\\lim_{{n\\to\\infty}} a\\,f(n/b)/f(n)={self._simplify_number_latex(lim_val)}<1",
                    }
                return {
                    "holds": False,
                    "note": f"\\lim_{{n\\to\\infty}} a\\,f(n/b)/f(n)={self._simplify_number_latex(lim_val)}\\ge 1",
                }
        except Exception:
            pass

        return {
            "holds": None,
            "note": "\\text{Regularidad no demostrada con cobertura simbólica actual.}",
        }

    def _format_master_n_power(self, p_expr: Expr) -> str:
        p_simplified = simplify(p_expr)
        if p_simplified.is_zero:
            return "1"
        if p_simplified == 1:
            return "n"
        return f"n^{{{self._simplify_latex_expr(latex(p_simplified))}}}"

    def _build_recursive_expansion_profile(
        self, proc_def: Dict[str, Any]
    ) -> RecursiveExpansionProfile:
        """
        Construye un perfil estructural de expansión recursiva.

        Este perfil separa:
        - guardas estructurales de caso base (tamaño/subproblema)
        - guardas de poda dependientes de datos (evitan llamadas recursivas)
        y provee evidencia para decidir variabilidad de casos.
        """
        profile = RecursiveExpansionProfile()

        recursive_calls = self._find_recursive_calls(proc_def)
        proc_name = proc_def.get("name", "") or (self.procedure_name or "")

        call_sites: List[RecursiveCallSite] = []
        for call in recursive_calls:
            line = call.get("pos", {}).get("line") if isinstance(call, dict) else None
            args = call.get("args", []) if isinstance(call, dict) else []
            call_sites.append(
                RecursiveCallSite(
                    node=call,
                    call_name=str(call.get("name") or call.get("callee") or proc_name),
                    args=list(args) if isinstance(args, list) else [],
                    line=line if isinstance(line, int) else None,
                )
            )

        size_signals = self._extract_size_signals(proc_def, recursive_calls)
        size_symbols: Set[str] = set(size_signals.get("size_symbols") or set())
        size_graph = size_signals.get("size_graph") or {}

        base_case_guards: List[GuardEvidence] = []
        data_dependent_guards: List[GuardEvidence] = []
        reason_codes: List[str] = []

        if_nodes: List[Dict[str, Any]] = []
        self._collect_if_nodes(proc_def.get("body", {}), if_nodes)

        has_pruning = False
        for if_node in if_nodes:
            test = if_node.get("test") or if_node.get("condition")
            consequent = if_node.get("consequent") or if_node.get("then") or if_node.get("thenBody")
            alternate = if_node.get("alternate") or if_node.get("else") or if_node.get("elseBody")

            then_returns = self._find_return_statements(consequent) if consequent else []
            else_returns = self._find_return_statements(alternate) if alternate else []

            then_has_rec = self._has_recursive_calls_in_node(consequent) if consequent else False
            else_has_rec = self._has_recursive_calls_in_node(alternate) if alternate else False

            guard = self._classify_guard(test, size_symbols=size_symbols, size_graph=size_graph)

            # Caso base estructural típico: hay return en una rama y recursión en la otra,
            # y la guarda es de tamaño/subproblema.
            if (then_returns or else_returns) and (then_has_rec or else_has_rec):
                if guard and guard.kind == "structural_base_case":
                    base_case_guards.append(guard)
                    reason_codes.append(guard.pattern)
                    continue

                # Poda dependiente de datos: return en una rama evita llamadas recursivas
                # que ocurren en otra rama y la guarda NO es base-case estructural.
                if guard and guard.kind == "data_dependent":
                    data_dependent_guards.append(guard)
                    reason_codes.append(guard.pattern)
                    has_pruning = True
                    continue

                if guard and guard.kind == "unknown":
                    data_dependent_guards.append(guard)
                    reason_codes.append(guard.pattern)
                    # unknown no autoriza pruning fuerte, pero sí indica posible variabilidad

        # Determinismo de expansión (heurística fuerte)
        determinism = self._assess_same_expansion_above_base(
            proc_def,
            recursive_calls=recursive_calls,
            base_case_guards=base_case_guards,
            size_symbols=size_symbols,
        )

        calls_before_non_base_return = self._calls_before_any_non_base_return(
            proc_def,
            recursive_calls=recursive_calls,
            base_case_guards=base_case_guards,
        )

        return RecursiveExpansionProfile(
            recursive_call_sites=call_sites,
            calls_before_any_non_base_return=calls_before_non_base_return,
            base_case_guards=base_case_guards,
            size_signals=size_signals,
            data_dependent_guards=data_dependent_guards,
            expansion_determinism=determinism,
            has_pruning=has_pruning,
            has_case_variability=None,
            reason_codes=reason_codes,
        )

    def _collect_if_nodes(self, node: Any, out: List[Dict[str, Any]]) -> None:
        if not isinstance(node, dict):
            return
        node_type = node.get("type", "")
        if node_type == "If" or node_type == "Conditional":
            out.append(node)
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._collect_if_nodes(item, out)
            elif isinstance(value, dict):
                self._collect_if_nodes(value, out)

    def _extract_size_signals(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extrae señales de tamaño desde argumentos de llamadas recursivas y relaciones
        simples desde asignaciones (grafo pequeño).
        """
        arg_symbols: Set[str] = set()
        transformed_symbols: Set[str] = set()
        edges: Dict[str, Set[str]] = {}

        def add_edge(dst: str, src: str) -> None:
            if not dst or not src:
                return
            if dst not in edges:
                edges[dst] = set()
            edges[dst].add(src)

        # 1) Señales desde argumentos de llamadas recursivas
        for call in recursive_calls:
            args = call.get("args", []) if isinstance(call, dict) else []
            if not isinstance(args, list):
                continue
            for arg in args:
                ids = self._collect_identifiers(arg)
                arg_symbols.update(ids)
                # marcar transformaciones típicas
                if isinstance(arg, dict) and (arg.get("type", "") or "").lower() == "binary":
                    op = arg.get("op", "") or arg.get("operator", "")
                    if op in {"+", "-", "*", "DIV", "/"}:
                        transformed_symbols.update(ids)

        # 2) Relaciones desde asignaciones tipo x <- expr
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        assigns: List[Dict[str, Any]] = []
        self._collect_assign_nodes(body, assigns)
        for a in assigns:
            lhs = a.get("left") or a.get("target") or a.get("var")
            rhs = a.get("right") or a.get("value")
            lhs_names = self._collect_identifiers(lhs)
            rhs_names = self._collect_identifiers(rhs)
            for dst in lhs_names:
                for src in rhs_names:
                    add_edge(dst, src)
            # Si RHS es una transformación típica (p.ej. (inicio+fin) DIV 2),
            # marcar LHS y sus fuentes como size-related candidatos.
            if isinstance(rhs, dict) and (rhs.get("type", "") or "").lower() == "binary":
                op = rhs.get("op", "") or rhs.get("operator", "")
                if op in {"+", "-", "*", "DIV", "/"}:
                    transformed_symbols.update(lhs_names)
                    transformed_symbols.update(rhs_names)

        # Propagación simple: si dst depende de size_symbol, dst también es size-related
        changed = True
        # Semilla de símbolos size-related: solo los que aparecen en transformaciones de tamaño,
        # no cualquier parámetro/identificador pasado en llamadas recursivas.
        size_related: Set[str] = set(transformed_symbols)
        while changed:
            changed = False
            for dst, srcs in edges.items():
                # Propagación hacia adelante: si dst depende de size-related, dst es size-related.
                if dst not in size_related and any(s in size_related for s in srcs):
                    size_related.add(dst)
                    changed = True
                # Propagación hacia atrás: si dst es size-related, sus fuentes también lo son.
                if dst in size_related:
                    for s in srcs:
                        if s not in size_related:
                            size_related.add(s)
                            changed = True

        return {
            "size_symbols": size_related,
            "direct_size_symbols": arg_symbols,
            "transformed_symbols": transformed_symbols,
            "size_graph": {k: sorted(v) for k, v in edges.items()},
        }

    def _collect_assign_nodes(self, node: Any, out: List[Dict[str, Any]]) -> None:
        if not isinstance(node, dict):
            return
        node_type = node.get("type", "")
        if node_type in {"Assign", "Assignment"}:
            out.append(node)
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._collect_assign_nodes(item, out)
            elif isinstance(value, dict):
                self._collect_assign_nodes(value, out)

    def _collect_identifiers(self, node: Any) -> Set[str]:
        names: Set[str] = set()
        if not isinstance(node, dict):
            return names
        node_type = (node.get("type", "") or "").lower()
        if node_type == "identifier":
            name = node.get("name")
            if isinstance(name, str) and name:
                names.add(name)
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    names.update(self._collect_identifiers(item))
            elif isinstance(value, dict):
                names.update(self._collect_identifiers(value))
        return names

    def _classify_guard(
        self,
        condition: Any,
        *,
        size_symbols: Set[str],
        size_graph: Dict[str, Any],
    ) -> Optional[GuardEvidence]:
        if not isinstance(condition, dict):
            return None
        node_type = (condition.get("type", "") or "").lower()
        if node_type != "binary":
            return GuardEvidence(
                node=condition,
                kind="unknown",
                pattern="guard_non_binary",
                line=condition.get("pos", {}).get("line")
                if isinstance(condition.get("pos"), dict)
                else None,
                related_size_symbols=set(),
            )
        op = condition.get("op", "") or condition.get("operator", "")
        left = condition.get("left", {})
        right = condition.get("right", {})
        left_ids = self._collect_identifiers(left)
        right_ids = self._collect_identifiers(right)
        related = set([n for n in left_ids.union(right_ids) if n in size_symbols])

        line = condition.get("pos", {}).get("line") if isinstance(condition.get("pos"), dict) else None

        # Nivel 1: comparación con constante sobre size-related
        if op in {"<=", "<", "==", "==="} and related:
            right_type = (right.get("type", "") or "").lower() if isinstance(right, dict) else ""
            if right_type in {"number", "literal"} and (right.get("value") is not None or right.get("val") is not None):
                return GuardEvidence(
                    node=condition,
                    kind="structural_base_case",
                    pattern="structural_base_case_constant",
                    line=line if isinstance(line, int) else None,
                    related_size_symbols=related,
                )

        # Nivel 2: igualdad/orden entre size-like vars (a == b, a >= b)
        if op in {"==", "===", ">=", ">", "<=", "<"}:
            if left_ids and right_ids and left_ids.issubset(size_symbols) and right_ids.issubset(size_symbols):
                return GuardEvidence(
                    node=condition,
                    kind="structural_base_case",
                    pattern="structural_base_case_interval_relation",
                    line=line if isinstance(line, int) else None,
                    related_size_symbols=related or left_ids.union(right_ids),
                )

        # Nivel 3: span algebraico (b - a) == 0 / <= 0
        if op in {"==", "===", "<=", "<"} and isinstance(left, dict):
            left_type = (left.get("type", "") or "").lower()
            if left_type == "binary":
                left_op = left.get("op", "") or left.get("operator", "")
                if left_op == "-":
                    span_ids = self._collect_identifiers(left)
                    if span_ids and span_ids.issubset(size_symbols):
                        right_type = (right.get("type", "") or "").lower() if isinstance(right, dict) else ""
                        if right_type in {"number", "literal"}:
                            val = right.get("value") if "value" in right else right.get("val")
                            try:
                                v_int = int(float(val))
                            except Exception:
                                v_int = None
                            if v_int == 0:
                                return GuardEvidence(
                                    node=condition,
                                    kind="structural_base_case",
                                    pattern="structural_base_case_span_zero",
                                    line=line if isinstance(line, int) else None,
                                    related_size_symbols=span_ids,
                                )
                            if v_int is not None and v_int <= 0:
                                return GuardEvidence(
                                    node=condition,
                                    kind="structural_base_case",
                                    pattern="structural_base_case_span_nonpositive",
                                    line=line if isinstance(line, int) else None,
                                    related_size_symbols=span_ids,
                                )

        # Data-dependent por descarte: binaria pero no conectada a size graph
        if left_ids or right_ids:
            if not related:
                return GuardEvidence(
                    node=condition,
                    kind="data_dependent",
                    pattern="conditional_pruning_on_data",
                    line=line if isinstance(line, int) else None,
                    related_size_symbols=set(),
                )

        return GuardEvidence(
            node=condition,
            kind="unknown",
            pattern="guard_unknown",
            line=line if isinstance(line, int) else None,
            related_size_symbols=related,
        )

    def _assess_same_expansion_above_base(
        self,
        proc_def: Dict[str, Any],
        *,
        recursive_calls: List[Dict[str, Any]],
        base_case_guards: List[GuardEvidence],
        size_symbols: Set[str],
    ) -> RecursiveExpansionDeterminism:
        """
        Heurística fuerte: si fuera del caso base la expansión siempre ejecuta el mismo
        patrón de llamadas recursivas (misma aridad y sin guardas data-dependent que
        omitan subllamadas), tratamos la expansión como estructuralmente determinista.
        """
        # Si no hay llamadas recursivas, no aplica.
        if not recursive_calls:
            return RecursiveExpansionDeterminism(level="weak", details=["no_recursive_calls"])

        # Si hay condicionales que cambien el número/presencia de subllamadas fuera
        # de los casos base estructurales, no podemos afirmar determinismo fuerte.
        if_nodes: List[Dict[str, Any]] = []
        self._collect_if_nodes(proc_def.get("body", {}), if_nodes)
        for if_node in if_nodes:
            test = if_node.get("test") or if_node.get("condition")
            consequent = if_node.get("consequent") or if_node.get("then") or if_node.get("thenBody")
            alternate = if_node.get("alternate") or if_node.get("else") or if_node.get("elseBody")

            then_has_rec = self._has_recursive_calls_in_node(consequent) if consequent else False
            else_has_rec = self._has_recursive_calls_in_node(alternate) if alternate else False

            # Si recursión está solo en una rama, es potencial pruning/variabilidad.
            if then_has_rec != else_has_rec:
                guard = self._classify_guard(
                    test,
                    size_symbols=size_symbols,
                    size_graph={},
                )
                if guard and guard.kind != "structural_base_case":
                    return RecursiveExpansionDeterminism(
                        level="medium",
                        details=["conditional_recursion_or_pruning", guard.pattern],
                    )

        call_count_effective = self._calculate_recursive_calls_count(proc_def, recursive_calls)
        if call_count_effective <= 0:
            return RecursiveExpansionDeterminism(level="weak", details=["no_effective_calls"])

        # Si a (effective) es estable y no hay condicionales que cambien presencia de recursión,
        # tratamos como determinista fuerte.
        if call_count_effective == len(recursive_calls) or call_count_effective in {1, 2}:
            return RecursiveExpansionDeterminism(
                level="strong",
                details=[
                    "same_expansion_above_base",
                    f"deterministic_call_arity_{call_count_effective}",
                ],
            )

        return RecursiveExpansionDeterminism(level="medium", details=["expansion_uncertain"])

    def _calls_before_any_non_base_return(
        self,
        proc_def: Dict[str, Any],
        *,
        recursive_calls: List[Dict[str, Any]],
        base_case_guards: List[GuardEvidence],
    ) -> bool:
        """
        Señal conservadora: ¿aparecen returns no-base antes de cualquier llamada recursiva?
        Si ocurre, sugiere poda/atajo que puede afectar best-case.
        """
        if not recursive_calls:
            return False
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        # Reusar el detector existente, pero bloqueando explícitamente guardas de caso base.
        # Si el detector encuentra return temprano y NO hay evidencia de caso base, marcamos True.
        if self._has_return_before_recursive_calls(body, recursive_calls):
            if base_case_guards:
                return False
            return True
        return False

    def _classify_case_variability(
        self, profile: RecursiveExpansionProfile
    ) -> CaseVariabilityDecision:
        """
        Decide variabilidad de casos usando el perfil de expansión.

        - deterministic_structural_recursion: expansión determinista, sin poda real.
        - data_dependent_pruning: evidencia de guardas por datos que omiten subllamadas.
        - unknown_variability: evidencia insuficiente (conservador; no shortcuts optimistas).
        """
        reasons = list(profile.reason_codes or [])
        reasons.extend(list(profile.expansion_determinism.details or []))

        if profile.has_pruning and profile.data_dependent_guards:
            return CaseVariabilityDecision(
                kind="data_dependent_pruning",
                has_case_variability=True,
                reason_codes=reasons
                + ["has_pruning_true", "data_dependent_guards_present"],
            )

        if (
            profile.expansion_determinism.level == "strong"
            and not profile.has_pruning
            and not profile.data_dependent_guards
        ):
            return CaseVariabilityDecision(
                kind="deterministic_structural_recursion",
                has_case_variability=False,
                reason_codes=reasons + ["deterministic_structural_recursion"],
            )

        # Si tenemos base cases estructurales pero no evidencia fuerte de poda,
        # por contrato preferimos no inventar variabilidad.
        if profile.base_case_guards and not profile.has_pruning:
            return CaseVariabilityDecision(
                kind="unknown_variability",
                has_case_variability=None,
                reason_codes=reasons + ["variability_unknown_insufficient_evidence"],
            )

        return CaseVariabilityDecision(
            kind="unknown_variability",
            has_case_variability=None,
            reason_codes=reasons + ["variability_unknown_insufficient_evidence"],
        )

    def _detect_early_return(self) -> bool:
        """
        Detecta si hay un return temprano antes de las llamadas recursivas.

        Un return temprano puede hacer que el mejor caso sea O(1) solo si no es
        un caso base dependiente del tamaño (n == 1, n <= c, etc.).
        Ejemplo: En búsqueda binaria, si el elemento está en el medio, se retorna O(1).

        Returns:
            True si hay un return temprano por contenido/datos
        """
        proc_def = self.proc_def  # Usar el proc_def guardado
        if not proc_def:
            return False

        body = proc_def.get("body", {}) or proc_def.get("block", {})
        recursive_calls = self._find_recursive_calls(proc_def)

        if not recursive_calls:
            return False

        # Si body es un Block, obtener su lista de statements
        if isinstance(body, dict) and body.get("type") == "Block":
            body.get("body", []) or body.get("statements", [])
        elif isinstance(body, list):
            pass

        # Buscar returns que estén antes de cualquier llamada recursiva en el flujo de control
        # Esto buscará en todo el body, incluyendo estructuras anidadas como IFs
        return self._has_return_before_recursive_calls(body, recursive_calls)

    def _has_return_before_recursive_calls(
        self, node: Any, recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Verifica si hay un return antes de las llamadas recursivas en el flujo de control.

        Patrón común: IF condición THEN RETURN valor; ELSE llamadas_recursivas

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si hay un return antes de las llamadas recursivas
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        # Si es un Return, verificar que no contiene llamadas recursivas
        if node_type == "Return":
            return not self._contains_recursive_call(node, recursive_calls)

        # Si es un If, verificar patrón común: return en THEN, recursivas en ELSE
        if node_type == "If" or node_type == "Conditional":
            condition = node.get("test") or node.get("condition")
            then_body = node.get("then") or node.get("thenBody") or node.get("consequent")
            else_body = node.get("else") or node.get("elseBody") or node.get("alternate")

            # Patrón: IF cond THEN RETURN (sin recursivas); sin ELSE o con ELSE con recursivas
            # Ej: IF (A[mitad]=x) THEN RETURN mitad; ... (early return en búsqueda binaria)
            if then_body and not else_body:
                returns_in_then = self._find_return_statements(then_body)
                has_early_return = any(
                    ret
                    for ret in returns_in_then
                    if not self._contains_recursive_call(ret, recursive_calls)
                )
                if has_early_return:
                    # Si hay recursivas en algún lugar del procedimiento, este return es early
                    return True

            # Verificar si en THEN hay return sin recursivas Y en ELSE hay recursivas
            if then_body and else_body:
                # Buscar todos los returns en THEN (pueden estar dentro de Blocks)
                returns_in_then = self._find_return_statements(then_body)

                # Verificar si alguno de los returns en THEN NO contiene recursivas
                has_early_return_in_then = False
                if returns_in_then:
                    for ret in returns_in_then:
                        if not self._contains_recursive_call(ret, recursive_calls):
                            has_early_return_in_then = True
                            break

                # Verificar recursivas en ELSE (pueden estar anidadas en otros IFs o dentro de Returns)
                # IMPORTANTE: Buscar recursivamente, incluso si están dentro de otro IF anidado
                has_recursive_in_else = self._has_recursive_calls_in_node(else_body)

                # Patrón clásico: return temprano en THEN, recursivas en ELSE (directas o anidadas)
                if has_early_return_in_then and has_recursive_in_else:
                    # Si es un caso base por tamaño, no cuenta como early return
                    # para bajar mejor caso a O(1): solo fija T(1).
                    is_base_case = False
                    if condition and isinstance(condition, dict) and condition.get("type"):
                        base_case_value = self._extract_base_case_from_condition(condition)
                        is_base_case = base_case_value is not None

                    if is_base_case:
                        return False
                    else:
                        # Si NO es caso base, cualquier return sin recursivas es early return
                        return True

        # Si es un Block o Begin, buscar secuencialmente
        if node_type == "Block" or node_type == "Begin":
            statements = node.get("statements", []) or node.get("body", [])
            if isinstance(statements, list):
                found_early_return = False
                for stmt in statements:
                    if not isinstance(stmt, dict):
                        continue

                    # Si es un Return sin recursivas, marcarlo
                    if stmt.get("type") == "Return":
                        if not self._contains_recursive_call(stmt, recursive_calls):
                            found_early_return = True
                            continue

                    # Si es un IF, verificar si tiene el patrón return en THEN, recursivas en ELSE
                    if stmt.get("type") == "If" or stmt.get("type") == "Conditional":
                        # IMPORTANTE: Verificar primero si es un caso base antes de buscar early returns
                        condition = stmt.get("test") or stmt.get("condition")
                        is_base_case = False
                        # Verificar que condition no sea None ni un diccionario vacío
                        if condition and isinstance(condition, dict) and condition.get("type"):
                            base_case_value = self._extract_base_case_from_condition(condition)
                            is_base_case = base_case_value is not None

                        # Si es caso base por tamaño, no cuenta como early return
                        # para mejor caso asintótico; continuar explorando otros nodos.
                        if is_base_case:
                            continue

                        # Si NO es caso base, buscar recursivamente en este IF
                        if self._has_return_before_recursive_calls(stmt, recursive_calls):
                            return True

                    # Si encontramos recursivas después de un return temprano, es válido
                    if self._has_recursive_calls_in_node(stmt):
                        if found_early_return:
                            return True
                        # Si encontramos recursivas antes de return temprano, continuar buscando

                # Si hay return temprano pero no encontramos recursivas después en este nivel,
                # buscar recursivamente en hijos
                if found_early_return:
                    # Verificar si hay recursivas en algún lugar después
                    for stmt in statements:
                        if self._has_recursive_calls_in_node(stmt):
                            return True
                    # Si no hay recursivas visibles aquí, buscar recursivamente
                    return True  # Hay return temprano, asumir que es válido

        # Buscar recursivamente en otros nodos
        # Pero NO en "statements" o "body" si ya los procesamos arriba
        processed_keys = set()
        if node_type == "Block" or node_type == "Begin":
            processed_keys.add("statements")
            processed_keys.add("body")
        if node_type == "If" or node_type == "Conditional":
            processed_keys.add("then")
            processed_keys.add("thenBody")
            processed_keys.add("consequent")
            processed_keys.add("else")
            processed_keys.add("elseBody")
            processed_keys.add("alternate")

        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"] or key in processed_keys:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_return_before_recursive_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_return_before_recursive_calls(value, recursive_calls):
                    return True

        return False

    def _is_simple_constant_return(self, ret_value: Any) -> bool:
        """
        Verifica si un return retorna una constante simple (TRUE, FALSE, 1, 0, etc.).

        Args:
            ret_value: Valor del return

        Returns:
            True si es una constante simple
        """
        if ret_value is None:
            return True  # Return sin valor es simple

        if isinstance(ret_value, dict):
            ret_type = ret_value.get("type", "").lower()
            # Literales y booleanos son constantes simples
            if ret_type in ["literal", "number", "boolean", "bool"]:
                return True
            # Identificadores como TRUE, FALSE también son simples
            if ret_type == "identifier":
                name = (ret_value.get("name", "") or ret_value.get("id", "")).upper()
                if name in ["TRUE", "FALSE", "TRUE", "FALSE"]:
                    return True
        elif isinstance(ret_value, (bool, int, float)):
            return True
        elif isinstance(ret_value, str):
            # Strings como "TRUE", "FALSE", "1", "0" son simples
            ret_upper = ret_value.upper()
            if ret_upper in ["TRUE", "FALSE", "1", "0"]:
                return True

        return False

    def _has_recursive_calls_in_node(self, node: Any) -> bool:
        """
        Verifica si un nodo o sus hijos contienen llamadas recursivas.

        Args:
            node: Nodo del AST

        Returns:
            True si contiene llamadas recursivas
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True

        # Buscar recursivamente en TODOS los campos (incluyendo "value" de Return, "args" de Call, etc.)
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_recursive_calls_in_node(item):
                        return True
            elif isinstance(value, dict):
                if self._has_recursive_calls_in_node(value):
                    return True

        return False

    def _contains_recursive_call(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si un nodo contiene alguna llamada recursiva.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si contiene una llamada recursiva
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._contains_recursive_call(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._contains_recursive_call(value, recursive_calls):
                    return True

        return False

    def _compare_f_with_g(self, f_n_str: str, log_b_a: float) -> Dict[str, Any]:
        """
        Compara f(n) con g(n) = n^(log_b a) para determinar el caso usando SymPy.

        Args:
            f_n_str: Expresión de f(n) como string (ej: "n", "n^2", "1")
            log_b_a: log_b(a)

        Returns:
            {"case": int, "comparison": str}
        """
        try:
            n_sym = Symbol("n", integer=True, positive=True)

            # Convertir f(n) a SymPy
            f_n_expr = self._parse_complexity_expression(f_n_str, n_sym)

            # Calcular g(n) = n^(log_b a)
            g_n_expr = n_sym**log_b_a

            # Comparar usando límites
            comparison_result = self._compare_with_limits(f_n_expr, g_n_expr, n_sym, log_b_a)

            return comparison_result

        except Exception:
            # Fallback a método simplificado
            return self._compare_f_with_g_simple(f_n_str, log_b_a)

    def _parse_complexity_expression(self, expr_str: str, n_sym: Symbol) -> Expr:
        """
        Parsea una expresión de complejidad a SymPy.

        Maneja: "1", "n", "n^2", "n log n", etc.

        Args:
            expr_str: Expresión como string
            n_sym: Símbolo de n en SymPy

        Returns:
            Expresión SymPy
        """
        expr_str = expr_str.strip().lower()

        if expr_str == "1" or expr_str == "0":
            return Integer(1)

        if expr_str == "n":
            return n_sym

        # Manejar n^k
        if "^" in expr_str:
            parts = expr_str.split("^")
            if len(parts) == 2 and parts[0].strip() == "n":
                try:
                    k = float(parts[1].strip())
                    return n_sym**k
                except Exception:
                    pass

        # Manejar n log n
        if "log" in expr_str and "n" in expr_str:
            if expr_str.replace(" ", "") == "nlog(n)" or expr_str.replace(" ", "") == "n*log(n)":
                from sympy import log

                return n_sym * log(n_sym)

        # Intentar parsear directamente con SymPy
        try:
            from sympy import log, sympify

            # Reemplazar n con el símbolo
            expr_str_clean = expr_str.replace("n", str(n_sym))
            return sympify(expr_str_clean, locals={"log": log})
        except Exception:
            # Fallback: asumir n
            return n_sym

    def _compare_with_limits(
        self, f_n_expr: Expr, g_n_expr: Expr, n_sym: Symbol, log_b_a: float
    ) -> Dict[str, Any]:
        """
        Compara f(n) y g(n)) usando límites cuando n → ∞.

        Args:
            f_n_expr: Expresión de f(n)
            g_n_expr: Expresión de g(n) = n^(log_b a)
            n_sym: Símbolo de n
            log_b_a: log_b(a)

        Returns:
            {"case": int, "comparison": str}
        """
        try:
            from sympy import Integer, limit, oo, simplify

            # Caso especial: si g(n) = 1 (log_b_a = 0) y f(n) = n, es Caso 3
            if abs(log_b_a) < 1e-10:
                # g(n) = n^0 = 1
                # Si f(n) tiene n como factor, entonces f(n) > g(n) → Caso 3
                if f_n_expr.has(n_sym):
                    # Verificar si f(n) es polinomial en n con exponente > 0
                    f_exponent = self._extract_exponent_from_expr(f_n_expr)
                    if f_exponent is not None and f_exponent > 0:
                        return {"case": 3, "comparison": "larger"}
                    # Si tiene n pero no es polinomial simple, verificar con límite
                    ratio = simplify(f_n_expr / g_n_expr)
                    lim = limit(ratio, n_sym, oo)
                    if lim == oo or (hasattr(lim, "is_infinite") and lim.is_infinite):
                        return {"case": 3, "comparison": "larger"}
                    # Si f(n) = 1, entonces f(n) = g(n) → Caso 2
                    if f_exponent == 0 or (isinstance(f_n_expr, Integer) and f_n_expr == 1):
                        return {"case": 2, "comparison": "equal"}

            # Caso especial: si g(n) = n (log_b_a = 1) y f(n) = n, es Caso 2
            if abs(log_b_a - 1.0) < 1e-10:
                # g(n) = n^1 = n
                # Si f(n) = n, entonces f(n) = g(n) → Caso 2
                f_exponent = self._extract_exponent_from_expr(f_n_expr)
                if f_exponent is not None and abs(f_exponent - 1.0) < 1e-10:
                    return {"case": 2, "comparison": "equal"}
                # Si f(n) tiene n pero con exponente diferente, verificar con límite
                if f_n_expr.has(n_sym):
                    ratio = simplify(f_n_expr / g_n_expr)
                    lim = limit(ratio, n_sym, oo)
                    # Si el límite es constante positiva (1), es Caso 2
                    if hasattr(lim, "is_number") and lim.is_number and lim > 0:
                        return {"case": 2, "comparison": "equal"}

            # Calcular límite de f(n) / g(n) cuando n → ∞
            ratio = simplify(f_n_expr / g_n_expr)
            lim = limit(ratio, n_sym, oo)

            # Si el límite es 0 → f(n) = o(g(n)) → Caso 1
            if lim == 0 or (isinstance(lim, (int, float)) and abs(lim) < 1e-10):
                return {"case": 1, "comparison": "smaller"}

            # Si el límite es constante positiva → f(n) = Θ(g(n)) → Caso 2
            if hasattr(lim, "is_number") and lim.is_number and lim > 0:
                return {"case": 2, "comparison": "equal"}

            # Si el límite es ∞ → f(n) = ω(g(n)) → Caso 3 (necesita verificar regularidad)
            if (
                lim == oo
                or (hasattr(lim, "is_infinite") and lim.is_infinite)
                or (isinstance(lim, (int, float)) and lim > 1e10)
            ):
                return {"case": 3, "comparison": "larger"}

            # Si el límite tiene log(n), podría ser Caso 2
            if "log" in str(lim).lower():
                # Verificar si es n^k * log(n) con k = log_b_a
                return {"case": 2, "comparison": "equal"}

        except Exception:
            pass

        # Fallback: comparación heurística
        return self._compare_heuristic(f_n_expr, g_n_expr, log_b_a)

    def _compare_heuristic(self, f_n_expr: Expr, g_n_expr: Expr, log_b_a: float) -> Dict[str, Any]:
        """
        Comparación heurística cuando los límites fallan.

        Args:
            f_n_expr: Expresión de f(n)
            g_n_expr: Expresión de g(n)
            log_b_a: log_b(a)

        Returns:
            {"case": int, "comparison": str}
        """
        from sympy import Integer, Symbol

        n_sym = Symbol("n", integer=True, positive=True)

        # Caso especial: si log_b_a = 0, entonces g(n) = 1
        if abs(log_b_a) < 1e-10:
            # g(n) = n^0 = 1
            # Si f(n) tiene n como factor, entonces f(n) > g(n) → Caso 3
            if f_n_expr.has(n_sym):
                f_exponent = self._extract_exponent_from_expr(f_n_expr)
                if f_exponent is not None and f_exponent > 0:
                    return {"case": 3, "comparison": "larger"}
                # Si tiene n pero no es polinomial simple, asumir Caso 3
                return {"case": 3, "comparison": "larger"}
            # Si f(n) = 1 (constante), entonces f(n) = g(n) → Caso 2
            if isinstance(f_n_expr, Integer) or (
                hasattr(f_n_expr, "is_number") and f_n_expr.is_number
            ):
                return {"case": 2, "comparison": "equal"}

        # Caso especial: si log_b_a = 1, entonces g(n) = n
        if abs(log_b_a - 1.0) < 1e-10:
            # g(n) = n^1 = n
            # Si f(n) = n, entonces f(n) = g(n) → Caso 2
            f_exponent = self._extract_exponent_from_expr(f_n_expr)
            if f_exponent is not None and abs(f_exponent - 1.0) < 1e-10:
                return {"case": 2, "comparison": "equal"}
            # Si f(n) tiene n pero con exponente diferente, verificar
            if f_n_expr.has(n_sym):
                # Si el exponente es menor que 1, es Caso 1
                if f_exponent is not None and f_exponent < 1.0 - 1e-10:
                    return {"case": 1, "comparison": "smaller"}
                # Si el exponente es mayor que 1, es Caso 3
                if f_exponent is not None and f_exponent > 1.0 + 1e-10:
                    return {"case": 3, "comparison": "larger"}

        # Extraer exponente de f(n) si es n^k
        f_exponent = self._extract_exponent_from_expr(f_n_expr)

        if f_exponent is not None:
            if f_exponent < log_b_a - 0.1:
                return {"case": 1, "comparison": "smaller"}
            elif abs(f_exponent - log_b_a) < 0.1:
                return {"case": 2, "comparison": "equal"}
            else:
                return {"case": 3, "comparison": "larger"}

        # Fallback: asumir Caso 2
        return {"case": 2, "comparison": "equal"}

    def _extract_exponent_from_expr(self, expr: Expr) -> Optional[float]:
        """
        Extrae el exponente de n de una expresión n^k.

        Args:
            expr: Expresión SymPy

        Returns:
            Exponente k o None
        """
        from sympy import Pow

        if isinstance(expr, Pow):
            base, exp = expr.as_base_exp()
            if str(base) == "n":
                try:
                    return float(exp)
                except Exception:
                    pass

        # Si es n directamente
        if str(expr) == "n":
            return 1.0

        # Si es constante
        if expr.is_number:
            return 0.0

        return None

    def _compare_f_with_g_simple(self, f_n_str: str, log_b_a: float) -> Dict[str, Any]:
        """
        Comparación simplificada (fallback).

        Args:
            f_n_str: Expresión de f(n) como string
            log_b_a: log_b(a)

        Returns:
            {"case": int, "comparison": str}
        """
        # Caso especial: si log_b_a = 0, entonces g(n) = 1
        if abs(log_b_a) < 1e-10:
            # g(n) = n^0 = 1
            # Si f(n) = "n", entonces f(n) > g(n) → Caso 3
            if f_n_str.strip().lower() == "n":
                return {"case": 3, "comparison": "larger"}
            # Si f(n) = "1", entonces f(n) = g(n) → Caso 2
            if f_n_str.strip() == "1" or f_n_str.strip() == "0":
                return {"case": 2, "comparison": "equal"}
            # Si f(n) tiene n como factor (contiene "n"), asumir Caso 3
            if "n" in f_n_str.lower():
                return {"case": 3, "comparison": "larger"}

        # Caso especial: si log_b_a = 1, entonces g(n) = n
        if abs(log_b_a - 1.0) < 1e-10:
            # g(n) = n^1 = n
            # Si f(n) = "n", entonces f(n) = g(n) → Caso 2
            if f_n_str.strip().lower() == "n":
                return {"case": 2, "comparison": "equal"}
            # Si f(n) tiene n con exponente 1, es Caso 2
            f_exponent = self._extract_exponent(f_n_str)
            if f_exponent is not None and abs(f_exponent - 1.0) < 1e-10:
                return {"case": 2, "comparison": "equal"}

        # Extraer exponente de f(n)
        f_exponent = self._extract_exponent(f_n_str)

        if f_exponent is None:
            # Por defecto, asumir Caso 2 si no se puede determinar
            return {"case": 2, "comparison": "equal"}

        # Comparar exponentes
        if f_exponent < log_b_a - 0.1:
            return {"case": 1, "comparison": "smaller"}
        elif abs(f_exponent - log_b_a) < 0.1:
            return {"case": 2, "comparison": "equal"}
        else:
            return {"case": 3, "comparison": "larger"}

    def _extract_exponent(self, f_n_str: str) -> Optional[float]:
        """
        Extrae el exponente de f(n) si es de la forma n^k.

        Args:
            f_n_str: Expresión de f(n)

        Returns:
            Exponente k o None
        """
        # Simplificado: buscar patrones como "n", "n^2", etc.
        if f_n_str == "n":
            return 1.0
        elif f_n_str == "1":
            return 0.0
        elif "^" in f_n_str or "**" in f_n_str:
            # Intentar extraer exponente
            try:
                # Buscar n^k o n^{k}
                import re

                match = re.search(r"n\^?\{?(\d+(?:\.\d+)?)\}?", f_n_str)
                if match:
                    return float(match.group(1))
            except Exception:
                pass

        return None

    def _check_regularity(self, a: int, b: float, f_n_str: str) -> Dict[str, Any]:
        """
        Verifica la condición de regularidad para Caso 3.

        Args:
            a: Número de subproblemas
            b: Factor de reducción
            f_n_str: Expresión de f(n)

        Returns:
            {"checked": bool, "note": str}
        """
        # Por ahora, asumir que se cumple si f(n) es polinómica
        # En el futuro, se puede verificar con SymPy: a·f(n/b) <= c·f(n) para c < 1

        # Simplificado: si f(n) = n^k con k > log_b_a, generalmente se cumple
        f_exponent = self._extract_exponent(f_n_str)
        log_b_a = math.log(a, b) if b > 1 else 1

        if f_exponent is not None and f_exponent > log_b_a:
            return {"checked": True, "note": self._note("regularity_verified")}

        return {"checked": False, "note": self._note("regularity_assumed")}

    def _simplify_latex_expr(self, latex_str: str) -> str:
        """
        Simplifica expresiones LaTeX comunes usando regex y reglas específicas.

        Args:
            latex_str: Expresión LaTeX a simplificar

        Returns:
            Expresión LaTeX simplificada
        """
        if not isinstance(latex_str, str):
            latex_str = str(latex_str)

        import re

        try:
            # Simplificar n^{0.0} o n^{0} → 1 (dentro de expresiones)
            latex_str = re.sub(r"n\^{0(\.0+)?\s*\}", "1", latex_str)
            latex_str = re.sub(r"\(n\^0(\.0+)?\)", "1", latex_str)
            latex_str = re.sub(r"\bn\^0(\.0+)?(?=\s|$|\)|,|})", "1", latex_str)

            # Simplificar n^{1.0} o n^{1} → n (dentro de expresiones)
            latex_str = re.sub(r"n\^{\s*1(\.0+)?\s*\}", "n", latex_str)
            latex_str = re.sub(r"\(n\^1(\.0+)?\)", "n", latex_str)
            latex_str = re.sub(r"\bn\^1(\.0+)?(?=\s|$|\)|,|})", "n", latex_str)

            # Simplificar log(n) → log n (sin paréntesis innecesarios cuando solo hay n)
            # Primero manejar \log (LaTeX con backslash) - usar re.escape para seguridad
            latex_str = re.sub(re.escape(r"\log") + r"\s*\(n\)", r"\\log n", latex_str)
            # Luego manejar log sin backslash (evitar capturar \log)
            # Usar un grupo de captura para preservar el carácter anterior si existe
            latex_str = re.sub(r"([^\\])log\s*\(n\)", r"\1log n", latex_str)
            # Manejar caso especial al inicio de la cadena
            if latex_str.startswith("log"):
                latex_str = re.sub(r"^log\s*\(n\)", "log n", latex_str)

            # Simplificar exponentes con .0 innecesarios dentro de llaves: {2.0} → {2}
            latex_str = re.sub(r"\{(\d+)\.0+(\}|\s)", r"{\1\2", latex_str)

            # Redondear exponentes decimales largos a 2 decimales: n^{2.8073549220576} → n^{2.81}
            def round_exponent(match):
                exp_str = match.group(1)
                try:
                    exp_num = float(exp_str)
                    rounded = round(exp_num, 2)
                    # Si después de redondear es un entero, quitar decimales
                    if abs(rounded - round(rounded)) < 1e-10:
                        return f"^{{{int(round(rounded))}}}"
                    # Siempre mostrar 2 decimales para exponentes decimales
                    return f"^{{{rounded:.2f}}}"
                except Exception:
                    return match.group(0)

            # Buscar patrones como n^{2.8073549220576} o cualquier exponente decimal
            latex_str = re.sub(r"\^\{(\d+\.\d+)\}", round_exponent, latex_str)

            # Simplificar exponentes decimales innecesarios: 2.0 → 2 (cuando está dentro de n^{2.0})
            latex_str = re.sub(r"\^\{(\d+)\.0+\}", r"^{\1}", latex_str)

            # Simplificar fracciones con denominador 1: \frac{k}{1} → k
            latex_str = re.sub(re.escape(r"\frac") + r"\{(\d+(?:\.\d+)?)\}\{1\}", r"\1", latex_str)

            # Simplificar multiplicación por 1: 1 \cdot x → x, x \cdot 1 → x
            # Usar re.escape para escapar \cdot correctamente
            cdot_pattern = re.escape(r"\cdot")
            # Simplificar 1 \cdot (cualquier cosa) → (cualquier cosa)
            latex_str = re.sub(r"1\s*" + cdot_pattern + r"\s*", "", latex_str)
            # Simplificar (cualquier cosa) \cdot 1 → (cualquier cosa)
            # Lookahead simplificado para evitar problemas de escape
            latex_str = re.sub(cdot_pattern + r"\s*1(?=\s|$|\)|}|,)", "", latex_str)

            # Simplificar logaritmos con multiplicación por 1
            log_pattern = re.escape(r"\log")
            # REGLAS PRIORITARIAS: Simplificar 1 \log n → \log n en cualquier contexto
            # Esto debe ejecutarse antes de otras simplificaciones para capturar todos los casos
            # Regla simple y directa: buscar "1 \log n" o "1 log n" y reemplazar por "\log n" o "log n"
            # 1 \log n → \log n (con uno o más espacios entre 1 y \log)
            latex_str = re.sub(r"1\s+" + log_pattern + r"\s+n", r"\\log n", latex_str)
            latex_str = re.sub(r"1\s*" + log_pattern + r"\s+n", r"\\log n", latex_str)
            # Manejar formato SymPy: 1 \log{\left(n \right)} → \log n
            left_right_pattern = re.escape(r"\left(") + r"\s*n\s*" + re.escape(r"\right)")
            latex_str = re.sub(
                r"1\s*" + log_pattern + r"\s*\{\s*" + left_right_pattern + r"\s*\}",
                r"\\log n",
                latex_str,
            )
            latex_str = re.sub(r"1\s+" + log_pattern + r"\s*\(\s*n\s*\)", r"\\log n", latex_str)
            # Manejar log sin backslash (con y sin espacios) - solo cuando hay espacios antes del 1
            # Para evitar reemplazar números como "21 log n", solo reemplazar si hay espacio, inicio, o paréntesis antes
            # Usar alternativas simples para evitar problemas con lookbehinds de ancho variable
            latex_str = re.sub(r"(?<=\s)1\s+log\s+n", "log n", latex_str)
            latex_str = re.sub(r"(?<=\()1\s+log\s+n", "log n", latex_str)
            latex_str = re.sub(r"^1\s+log\s+n", "log n", latex_str)
            latex_str = re.sub(r"(?<=\s)1\s*log\s+n", "log n", latex_str)
            latex_str = re.sub(r"(?<=\()1\s*log\s+n", "log n", latex_str)
            latex_str = re.sub(r"^1\s*log\s+n", "log n", latex_str)
            # Manejar casos sin espacios: 1logn → log n (solo si está aislado)
            latex_str = re.sub(r"(?<=\s)1log\s+n", "log n", latex_str)
            latex_str = re.sub(r"(?<=\()1log\s+n", "log n", latex_str)
            latex_str = re.sub(r"^1log\s+n", "log n", latex_str)
            # Simplificar 1\log n (sin espacios) → \log n
            latex_str = re.sub(r"(?<=\s)1" + log_pattern + r"n", r"\\log n", latex_str)
            latex_str = re.sub(r"(?<=\()1" + log_pattern + r"n", r"\\log n", latex_str)
            latex_str = re.sub(r"^1" + log_pattern + r"n", r"\\log n", latex_str)

            # Simplificar \log n \cdot 1 → \log n (diferentes formatos)
            latex_str = re.sub(
                log_pattern + r"\s+n\s+" + cdot_pattern + r"\s*1(?=\s|$|\)|}|,)",
                r"\\log n",
                latex_str,
            )
            # Manejar formato SymPy con \left y \right
            left_right_n = re.escape(r"\left(") + r"\s*n\s*" + re.escape(r"\right)")
            latex_str = re.sub(
                log_pattern
                + r"\s*\{\s*"
                + left_right_n
                + r"\s*\}\s+"
                + cdot_pattern
                + r"\s*1(?=\s|$|\)|}|,)",
                r"\\log n",
                latex_str,
            )

            # Simplificar expresiones generales: 1 * cualquier_expresión → cualquier_expresión
            # (solo si está precedido por espacios, inicio, o paréntesis)
            # Separar las alternativas para evitar problemas con lookbehinds
            latex_str = re.sub(r"(?<=\s)1\s*\*\s*", "", latex_str)  # 1 * expr después de espacio
            latex_str = re.sub(r"(?<=\()1\s*\*\s*", "", latex_str)  # 1 * expr después de (
            latex_str = re.sub(r"^1\s*\*\s*", "", latex_str)  # 1 * expr al inicio
            latex_str = re.sub(r"\*\s*1(?=\s|$|\)|}|,)", "", latex_str)  # expr * 1

            # Simplificar paréntesis LaTeX de SymPy: \left(n\right) → n (cuando es simple)
            latex_str = re.sub(
                re.escape(r"\left(") + r"n\s*" + re.escape(r"\right)"), "n", latex_str
            )
            latex_str = re.sub(
                re.escape(r"\left[") + r"\s*n\s*" + re.escape(r"\right]"),
                "n",
                latex_str,
            )

            # Simplificar paréntesis innecesarios alrededor de n simple: (n) → n
            # PERO NO simplificar si está dentro de comandos LaTeX como \Theta(n), \Omega(n), O(n)
            # Proteger comandos LaTeX comunes antes de simplificar
            # Lista de comandos LaTeX que deben mantener (n) con paréntesis
            latex_commands = ["Theta", "Omega", "O", "o"]
            for cmd in latex_commands:
                # Proteger el patrón \comando(n) para que no se simplifique
                pattern = re.escape(f"\\{cmd}") + r"\s*\(n\)"
                # Reemplazar temporalmente con un marcador único
                latex_str = re.sub(pattern, f"__PROTECTED_{cmd}__", latex_str)

            # Ahora simplificar (n) → n solo si no está protegido
            latex_str = re.sub(r"\(n\)(?=\s|$|\)|,|})", "n", latex_str)

            # Restaurar los comandos protegidos
            for cmd in latex_commands:
                latex_str = latex_str.replace(f"__PROTECTED_{cmd}__", f"\\{cmd}(n)")

        except Exception as e:
            # Si hay un error en el regex, retornar la cadena original
            # para evitar romper el análisis completo
            print(f"[_simplify_latex_expr] Error en simplificación: {e}")
            return latex_str

        return latex_str.strip()

    def _simplify_expr_latex(self, expr: Expr) -> str:
        """
        Simplifica una expresión SymPy y la convierte a LaTeX con simplificaciones adicionales.

        Args:
            expr: Expresión SymPy a simplificar

        Returns:
            String LaTeX simplificado
        """
        from sympy import powsimp, simplify

        # Simplificar la expresión usando SymPy
        try:
            simplified = simplify(expr)
            simplified = powsimp(simplified, force=True)
        except Exception:
            simplified = expr

        # Convertir a LaTeX
        latex_str = latex(simplified)

        # Aplicar simplificaciones adicionales
        return self._simplify_latex_expr(latex_str)

    def _canonicalize_numeric(self, value: Any) -> float | int:
        """
        Normaliza números para mantener exactitud de presentación y evitar ruido de flotante.
        Convierte x.0 a int y conserva decimales reales.
        """
        try:
            numeric = float(value)
        except Exception:
            return value

        if abs(numeric - round(numeric)) < 1e-10:
            return int(round(numeric))
        return numeric

    def _simplify_number_latex(self, num: float) -> str:
        """
        Simplifica un número para LaTeX.

        Args:
            num: Número a simplificar

        Returns:
            String LaTeX simplificado
        """
        # Si es entero (dentro de tolerancia), retornar como entero
        if abs(num - round(num)) < 1e-10:
            return str(int(round(num)))

        # Si está muy cerca de fracciones comunes, simplificar
        from fractions import Fraction

        try:
            frac = Fraction(num).limit_denominator(100)
            if frac.denominator == 1:
                return str(frac.numerator)
            # Si el denominador es razonable, usar fracción LaTeX
            if frac.denominator <= 20:
                if frac.numerator == 1:
                    return f"\\frac{{1}}{{{frac.denominator}}}"
                else:
                    return f"\\frac{{{frac.numerator}}}{{{frac.denominator}}}"
        except Exception:
            pass

        # Redondear a 2 decimales y eliminar .0 si es necesario
        rounded = round(num, 2)
        if abs(rounded - round(rounded)) < 1e-10:
            return str(int(round(rounded)))
        return str(rounded)

    def _calculate_theta(self, case: int, g_n_expr: Expr, f_n_str: str, log_b_a: float) -> str:
        """
        Calcula Θ(...) según el caso del Teorema Maestro.

        Args:
            case: Caso (1, 2, 3)
            g_n_expr: Expresión de g(n) = n^(log_b a)
            f_n_str: Expresión de f(n)
            log_b_a: log_b(a)

        Returns:
            Expresión Θ(...) en formato LaTeX
        """
        if case == 1:
            # T(n) = Θ(g(n)) = Θ(n^(log_b a))
            g_n_latex = self._simplify_expr_latex(g_n_expr)
            result = f"\\Theta({g_n_latex})"
            # Simplificar el resultado final para casos como \Theta(1) → \Theta(1)
            return self._simplify_latex_expr(result)
        elif case == 2:
            # T(n) = Θ(g(n) · log n) = Θ(n^(log_b a) · log n)
            if abs(log_b_a - 1.0) < 0.1:
                result = "\\Theta(n \\log n)"
            else:
                g_n_latex = self._simplify_expr_latex(g_n_expr)
                result = f"\\Theta({g_n_latex} \\log n)"
            # Simplificar el resultado final para casos como \Theta(1 \log n) → \Theta(\log n)
            return self._simplify_latex_expr(result)
        else:  # case == 3
            # T(n) = Θ(f(n))
            # Simplificar f(n) si es posible
            simplified_f = self._simplify_latex_expr(f_n_str)
            result = f"\\Theta({simplified_f})"
            # Simplificar el resultado final
            return self._simplify_latex_expr(result)

    def result(self) -> Dict[str, Any]:
        """
        Genera la respuesta estándar del análisis recursivo.

        Returns:
            Diccionario con byLine, totals (incluyendo recurrence, master o iteration, proof)
        """
        # Construir byLine básico (puede estar vacío para recursivos)
        by_line = []

        # Determinar T_open según el método usado y el modo (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if self.characteristic_equation:
            # Para characteristic_equation, si hay early return y estamos en modo best, usar Θ(1)
            # El theta ya debería estar ajustado en _apply_characteristic_equation_method, pero verificamos por seguridad
            if self.mode == "best" and self.characteristic_equation.get("has_early_return", False):
                t_open = "\\Theta(1)"
            else:
                t_open = self.characteristic_equation.get("theta", "N/A")
        elif self.iteration:
            t_open = self.iteration.get("theta", "N/A")
        elif self.recursion_tree:
            t_open = self.recursion_tree.get("theta", "N/A")
        elif self.master:
            # Para master theorem, usar theta_best si mode="best"
            # Sino usar theta (worst/average)
            if self.mode == "best":
                t_open = self.master.get("theta_best", self.master.get("theta", "N/A"))
            else:
                t_open = self.master.get("theta", "N/A")
        else:
            t_open = "N/A"

        # Construir totals (big_theta para que get_notation_from_totals sea genérico)
        totals = {
            "T_open": t_open,
            "big_theta": t_open if t_open and t_open != "N/A" else None,
            "symbols": self.symbols if self.symbols else None,
            "notes": self.notes if self.notes else None,
        }

        if self.dp_validation_events:
            totals["dp_validation_events"] = self.dp_validation_events.copy()

        # Agregar información de recurrencia
        if self.recurrence:
            totals["recurrence"] = self.recurrence

        # Agregar resultado del método aplicado (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if self.characteristic_equation:
            totals["characteristic_equation"] = self.characteristic_equation
        elif self.iteration:
            totals["iteration"] = self.iteration
        elif self.recursion_tree:
            totals["recursion_tree"] = self.recursion_tree
        elif self.master:
            totals["master"] = self.master

        # Construir proof desde proof_steps
        proof = []
        for step in self.proof_steps:
            # Si ya es un diccionario, usarlo directamente
            if isinstance(step, dict):
                proof.append(step)
            # Si es un string, intentar parsearlo (compatibilidad hacia atrás)
            elif isinstance(step, str):
                if ":" in step:
                    parts = step.split(":", 1)
                    proof.append({"id": parts[0].strip(), "text": parts[1].strip()})
                else:
                    proof.append({"id": "step", "text": step})

        totals["proof"] = proof

        return {"ok": True, "byLine": by_line, "totals": totals}

    def clear(self):
        """Limpia todos los datos del analizador."""
        super().clear()
        self.procedure_name = None
        self.proc_def = None
        self.ast = None
        self.recurrence = None
        self.master = None
        self.proof = []
        self.proof_steps = []
        self.iteration = None
        self.recursion_tree = None
        self.characteristic_equation = None
        self.dp_validation_events = []

    # ============================================================================
    # MÉTODO DE ECUACIÓN CARACTERÍSTICA (LINEAL CON DESPLAZAMIENTOS CONSTANTES)
    # ============================================================================

    def _detect_linear_recurrence(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Detecta si la recurrencia es lineal con desplazamientos constantes.

        Forma: T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas

        Returns:
            Dict con información de la recurrencia lineal o None si no aplica
            {
                "is_linear": bool,
                "coefficients": {offset: coefficient},  # ej: {1: 1, 2: 1} para T(n) = T(n-1) + T(n-2)
                "max_offset": int,  # k (máximo desplazamiento)
                "g_n": str  # término no homogéneo g(n) en LaTeX
            }
        """
        if not recursive_calls:
            return None

        # Analizar todos los subproblemas
        subproblem_info_list = []
        for call in recursive_calls:
            subproblem_info = self._analyze_subproblem_type(call, proc_def)
            if subproblem_info:
                subproblem_info_list.append(subproblem_info)

        # Verificar que al menos hay una llamada recursiva analizada
        if not subproblem_info_list:
            return None

        # Solo considerar si todos los subproblemas analizados son de tipo "subtraction" (n-1, n-2, etc.)
        # Si alguna llamada recursiva no se pudo analizar (subproblem_info es None), no la incluimos
        # pero si todas las que se analizaron son "subtraction", entonces es lineal
        subtraction_count = sum(
            1 for info in subproblem_info_list if info.get("type") == "subtraction"
        )

        # Si no todas las llamadas analizadas son de tipo "subtraction", no es lineal
        if subtraction_count != len(subproblem_info_list):
            return None

        # Si no hay ninguna llamada de tipo "subtraction", no es lineal
        if subtraction_count == 0:
            return None

        # Extraer los desplazamientos (offsets)
        # Ejemplo: n-1 -> offset=1, n-2 -> offset=2
        coefficients = Counter()
        for info in subproblem_info_list:
            if info and info.get("type") == "subtraction":
                pattern = info.get("pattern", "")
                # Extraer el número del patrón "n-k"
                if pattern.startswith("n-"):
                    try:
                        offset = int(pattern[2:])
                        coefficients[offset] += 1
                    except ValueError:
                        # Si no es un número constante, no es lineal
                        return None

        if not coefficients:
            return None

        # Verificar que todos los offsets son constantes positivos
        max_offset = max(coefficients.keys())
        if max_offset <= 0:
            return None

        # Obtener g(n) (término no homogéneo)
        # IMPORTANTE: No convertir f(n) a 0 automáticamente, ya que el trabajo no recursivo
        # (como acceso a arrays, operaciones con datos, etc.) debe incluirse en la recurrencia
        f_n = self._calculate_non_recursive_work(proc_def, recursive_calls)

        # Si f(n) es 0, la recurrencia es homogénea (correcto)
        # Si f(n) es diferente de 0 (incluso si es O(1)), debe incluirse en la recurrencia
        # NO convertir f(n) = "1" a "0" porque el acceso a arrays y otras operaciones
        # no recursivas son trabajo real que debe contarse

        return {
            "is_linear": True,
            "coefficients": dict(coefficients),
            "max_offset": max_offset,
            "g_n": f_n,
        }

    def _get_proc_param_names(self, proc_def: Dict[str, Any]) -> List[str]:
        """Extrae los nombres de parámetros declarados en el procedimiento."""
        names: List[str] = []
        for param in proc_def.get("params", []) or []:
            if isinstance(param, dict):
                name = param.get("name") or param.get("id")
            else:
                name = str(param)
            if isinstance(name, str) and name:
                names.append(name)
        return names

    def _resolve_size_parameter_name(self, proc_def: Dict[str, Any]) -> Optional[str]:
        """Determina el parámetro que modela el tamaño principal del subproblema."""
        param_names = self._get_proc_param_names(proc_def)
        if not param_names:
            return None

        size_candidates = [name.lower() for name in self.detect_size_variables_from_proc(proc_def)]
        for param_name in param_names:
            if param_name.lower() in size_candidates:
                return param_name

        common_size_names = {"n", "size", "length", "len", "tam", "tamaño", "tamanio"}
        for param_name in param_names:
            if param_name.lower() in common_size_names:
                return param_name

        if len(param_names) > 1:
            return param_names[1]

        return param_names[0]

    def _argument_preserves_parameter_identity(self, arg: Any, param_name: str) -> bool:
        """True si el argumento conserva exactamente el mismo parámetro de entrada."""
        if not isinstance(arg, dict):
            return False

        node_type = arg.get("type", "").lower()
        if node_type == "identifier":
            arg_name = arg.get("name") or arg.get("id") or ""
            return isinstance(arg_name, str) and arg_name.lower() == param_name.lower()

        return False

    def _find_changed_non_size_params(
        self,
        proc_def: Dict[str, Any],
        recursive_calls: List[Dict[str, Any]],
        size_param_name: Optional[str],
    ) -> List[str]:
        """Lista parámetros auxiliares cuyo valor cambia entre llamadas recursivas."""
        changed: List[str] = []
        param_names = self._get_proc_param_names(proc_def)

        for index, param_name in enumerate(param_names):
            if size_param_name and param_name.lower() == size_param_name.lower():
                continue

            for call in recursive_calls:
                args = call.get("args", []) or []
                if index >= len(args):
                    continue
                if not self._argument_preserves_parameter_identity(args[index], param_name):
                    changed.append(param_name)
                    break

        return sorted(set(changed))

    def _build_dp_validation(
        self,
        proc_def: Dict[str, Any],
        recursive_calls: List[Dict[str, Any]],
        linear_info: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Valida si una recurrencia lineal encaja bien como caso de programación dinámica."""
        coefficients = linear_info.get("coefficients", {})
        shifts = sorted(coefficients.keys())
        max_offset = int(linear_info.get("max_offset", 0) or 0)
        total_calls = sum(coefficients.values())
        contiguous_shifts = bool(shifts) and shifts == list(range(1, max_offset + 1))
        size_param_name = self._resolve_size_parameter_name(proc_def)
        changed_non_size_params = self._find_changed_non_size_params(
            proc_def,
            recursive_calls,
            size_param_name,
        )

        status = "rejected"
        confidence = "low"
        primary_pattern = "none"
        supported_patterns: List[str] = []
        reasons: List[str] = []

        if total_calls < 2:
            reasons.append(
                "Solo hay una rama recursiva efectiva por estado; no hay suficiente solapamiento de subproblemas para justificar PD."
            )
        elif changed_non_size_params:
            reasons.append(
                "Los parámetros de estado cambian entre llamadas recursivas ("
                + ", ".join(changed_non_size_params)
                + "), por lo que los subproblemas no son equivalentes."
            )
        else:
            status = "clear"
            confidence = "high"
            supported_patterns = ["tabulation", "memoization"]
            if contiguous_shifts and max_offset <= 3:
                primary_pattern = "rolling_window"
                supported_patterns.append("rolling_window")
                reasons.append(
                    "La recurrencia depende solo de los últimos estados contiguos y puede optimizarse con memoria acotada."
                )
            else:
                primary_pattern = "tabulation"
                reasons.append(
                    "La recurrencia requiere conservar estados no contiguos o un historial más largo que una ventana pequeña."
                )

            reasons.append(
                "Las llamadas recursivas reutilizan subproblemas definidos por el mismo parámetro de tamaño."
            )

        validation = {
            "status": status,
            "applicable": status != "rejected",
            "confidence": confidence,
            "primary_pattern": primary_pattern,
            "supported_patterns": supported_patterns,
            "reasons": reasons,
            "debug": {
                "size_parameter": size_param_name,
                "recursive_call_count": total_calls,
                "distinct_shifts": shifts,
                "max_offset": max_offset,
                "contiguous_shifts": contiguous_shifts,
                "changed_non_size_params": changed_non_size_params,
            },
        }

        self.dp_validation_events.append(validation)
        for reason in reasons:
            prefix = "DP validada" if validation["applicable"] else "DP descartada"
            self.add_note(f"{prefix}: {reason}")

        return validation

    def _build_non_dp_validation(self, reason: str) -> Dict[str, Any]:
        """Registra el descarte explícito de PD para recurrencias fuera del perfil esperado."""
        validation = {
            "status": "rejected",
            "applicable": False,
            "confidence": "high",
            "primary_pattern": "none",
            "supported_patterns": [],
            "reasons": [reason],
            "debug": {},
        }
        self.dp_validation_events.append(validation)
        self.add_note(f"DP descartada: {reason}")
        return validation

    def _detect_characteristic_equation_method(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Detecta si debe usarse el Método de Ecuación Característica.

        Prioridad ALTA sobre Método de Iteración.

        Aplica cuando la recurrencia es lineal con desplazamientos constantes:
        T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas

        Returns:
            True si debe usar Ecuación Característica
        """
        linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
        return linear_info is not None and linear_info.get("is_linear", False)

    def _has_case_variability(self) -> bool:
        """
        Detecta si el algoritmo tiene variabilidad entre worst/best/avg.

        Para algoritmos recursivos determinísticos (ej: Fibonacci), la estructura
        del árbol recursivo es siempre idéntica, por lo que worst/best/avg son iguales.

        Un algoritmo tiene variabilidad si:
        - Tiene ramas condicionales que afectan el número de llamadas recursivas
        - Tiene early returns que cambian según los datos
        - El tamaño de los subproblemas varía según los datos

        Returns:
            True si hay variabilidad, False si worst/best/avg son idénticos
        """
        if not self.proc_def:
            return True  # Por defecto, asumir variabilidad

        # Para algoritmos con ecuación característica (lineales con desplazamientos constantes),
        # típicamente NO hay variabilidad porque la estructura es determinística
        if self.recurrence and self.recurrence.get("method") == "characteristic_equation":
            # Verificar si hay ramas condicionales que afecten recursión
            body = self.proc_def.get("body", {}) or self.proc_def.get("block", {})

            # Buscar IF que contengan llamadas recursivas en diferentes ramas
            recursive_calls = self._find_recursive_calls(self.proc_def)
            if not recursive_calls:
                return True

            # Verificar si las llamadas recursivas están en diferentes ramas condicionales
            # Si todas las llamadas recursivas están en la misma rama (o fuera de IF),
            # entonces no hay variabilidad
            has_conditional_recursion = self._has_conditional_recursive_calls(body, recursive_calls)

            # SIEMPRE verificar early returns que afectan el flujo recursivo
            # Un early return que evita la recursión (ej: IF condición THEN RETURN; ELSE recursivas)
            # crea variabilidad porque el mejor caso puede terminar antes
            # Ejemplo: buscarLista - si encuentra el valor, retorna O(1); si no, hace recursión O(n)
            has_early_return = self._detect_early_return()

            # Para ecuación característica (lineal con desplazamientos constantes),
            # típicamente NO hay variabilidad porque el algoritmo es determinístico.
            # Solo hay variabilidad si:
            # 1. Hay condicionales que afecten el flujo recursivo (recursivas en ambas ramas)
            # 2. Hay early returns que eviten la recursión (mejor caso termina antes)
            # Para Fibonacci, todas las llamadas recursivas están en el mismo bloque (ELSE),
            # y no hay early returns que eviten recursión, así que no hay variabilidad.
            if not has_conditional_recursion and not has_early_return:
                return False  # No hay variabilidad (worst/best/avg son idénticos)

            return True  # Hay variabilidad

        # Para otros métodos, verificar de manera similar
        return True  # Por defecto, asumir variabilidad

    def _has_conditional_recursive_calls(
        self, node: Any, recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Verifica si hay llamadas recursivas en diferentes ramas condicionales.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si hay llamadas recursivas en diferentes ramas condicionales
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        # Si encontramos un IF con llamadas recursivas en ambas ramas
        if node_type == "If":
            consequent = node.get("consequent", {})
            alternate = node.get("alternate", {})

            # Verificar si hay llamadas recursivas en cada rama
            has_in_consequent = self._contains_recursive_call(consequent, recursive_calls)
            has_in_alternate = self._contains_recursive_call(alternate, recursive_calls)

            # Si hay en ambas ramas, hay variabilidad
            if has_in_consequent and has_in_alternate:
                return True

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_conditional_recursive_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_conditional_recursive_calls(value, recursive_calls):
                    return True

        return False

    def _contains_recursive_call(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si un nodo contiene una llamada recursiva.

        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas (no se usa directamente, pero útil para tipo)

        Returns:
            True si contiene una llamada recursiva
        """
        if not isinstance(node, dict):
            return False

        node_type = node.get("type", "")

        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._contains_recursive_call(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._contains_recursive_call(value, recursive_calls):
                    return True

        return False

    def _apply_characteristic_equation_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Ecuación Característica para resolver la recurrencia.

        Resuelve recurrencias lineales de la forma:
        T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)

        Returns:
            {"success": bool, "characteristic_equation": dict, "reason": str}
        """
        if not self.recurrence:
            return {"success": False, "reason": "No hay recurrencia extraída"}

        def _strip_outer_parentheses(base: str) -> str:
            cleaned = str(base or "").strip()
            if cleaned.startswith("\\left(") and cleaned.endswith("\\right)"):
                return cleaned[len("\\left(") : -len("\\right)")].strip()
            if cleaned.startswith("(") and cleaned.endswith(")"):
                return cleaned[1:-1].strip()
            return cleaned

        def _is_atomic_latex_base(base: str) -> bool:
            cleaned = _strip_outer_parentheses(base)
            if not cleaned:
                return False

            atomic_patterns = (
                r"[-+]?\d+(?:\.\d+)?",
                r"[A-Za-z](?:_\{?[A-Za-z0-9]+\}?)?",
                r"\\[A-Za-z]+(?:_\{?[A-Za-z0-9]+\}?)?",
            )
            return any(re.fullmatch(pattern, cleaned) for pattern in atomic_patterns)

        def _pow_n(base: str) -> str:
            cleaned = _strip_outer_parentheses(base)
            if _is_atomic_latex_base(cleaned):
                return f"{cleaned}^n"
            return f"\\left({cleaned}\\right)^n"

        def _is_zero_g(raw_g: Optional[str]) -> bool:
            cleaned = str(raw_g or "").strip().lower()
            return cleaned in {"", "0", "\\theta(0)", "theta(0)"}

        def _parse_constant_g(raw_g: Optional[str]) -> Optional[Expr]:
            cleaned = str(raw_g or "").strip()
            if not cleaned:
                return Integer(0)
            lowered = cleaned.lower().replace(" ", "")
            if lowered in {"0", "\\theta(0)", "theta(0)"}:
                return Integer(0)
            if lowered in {"\\theta(1)", "theta(1)"}:
                return Integer(1)
            if re.fullmatch(r"[-+]?\d+", lowered):
                return Integer(int(lowered))
            if re.fullmatch(r"[-+]?\d*\.?\d+", lowered):
                return sympify(lowered)
            return None

        def _extract_base_case_index(label: str) -> Optional[int]:
            match = re.search(r"T\(([-]?\d+)\)", str(label))
            if not match:
                return None
            try:
                return int(match.group(1))
            except Exception:
                return None

        def _root_magnitude(root_expr: Expr) -> float:
            try:
                return float(Abs(root_expr).evalf())
            except Exception:
                try:
                    return abs(complex(root_expr.evalf()))
                except Exception:
                    return 0.0

        def _expression_score(expr: Expr) -> Tuple[int, int, int]:
            try:
                op_count = int(expr.count_ops())
            except Exception:
                op_count = 10**9
            try:
                latex_len = len(latex(expr))
            except Exception:
                latex_len = 10**9
            # Penalizar formas con potencias simbólicas negativas (ej: 2^{-n})
            negative_symbolic_power_penalty = 0
            try:
                for power_expr in expr.atoms(Pow):
                    exp = getattr(power_expr, "exp", None)
                    if exp is None:
                        continue
                    if exp.free_symbols and exp.could_extract_minus_sign():
                        negative_symbolic_power_penalty += 1
            except Exception:
                negative_symbolic_power_penalty = 10**6
            return (negative_symbolic_power_penalty, op_count, latex_len)

        def _choose_simplest_expression(
            expr: Expr, extra_candidates: Optional[List[Expr]] = None
        ) -> Expr:
            candidates: List[Expr] = [expr]
            for transform in (simplify, factor, expand):
                try:
                    transformed = transform(expr)
                    if transformed is not None:
                        candidates.append(transformed)
                except Exception:
                    continue
            for extra in extra_candidates or []:
                if extra is not None:
                    candidates.append(extra)

            unique_candidates: List[Expr] = []
            seen = set()
            for candidate in candidates:
                key = str(candidate)
                if key in seen:
                    continue
                seen.add(key)
                unique_candidates.append(candidate)

            return min(unique_candidates, key=_expression_score) if unique_candidates else expr

        def _try_closed_form_with_rsolve(
            *,
            coeffs: Dict[int, int],
            g_raw: str,
            base_case_map: Dict[str, Any],
            order: int,
        ) -> Optional[Expr]:
            g_constant = _parse_constant_g(g_raw)
            if g_constant is None:
                return None

            t_fn = Function("T")
            rhs = sum(coeff * t_fn(n - offset) for offset, coeff in coeffs.items()) + g_constant
            recurrence_eq = Eq(t_fn(n), rhs)

            initial_conditions: Dict[Expr, Expr] = {}
            for label, value in base_case_map.items():
                idx = _extract_base_case_index(label)
                if idx is None:
                    continue
                try:
                    initial_conditions[t_fn(idx)] = sympify(value)
                except Exception:
                    continue

            if len(initial_conditions) < max(order, 1):
                return None

            try:
                solved = rsolve(recurrence_eq, t_fn(n), initial_conditions)
            except Exception:
                return None
            if solved is None:
                return None

            # Debe devolver forma cerrada sin constantes libres C_i.
            unresolved = [sym for sym in solved.free_symbols if str(sym).startswith("C")]
            if unresolved:
                return None
            return solved

        def _root_is_symbolically_simple(root_expr: Expr) -> bool:
            """
            Heurística de seguridad: evita solve exacto de constantes cuando las raíces
            tienen forma algebraica pesada (ej. radicales cúbicos), que puede bloquear SymPy.
            """
            try:
                simplified_root = simplify(root_expr)
            except Exception:
                simplified_root = root_expr

            if bool(simplified_root.has(I)):
                return False

            if bool(
                simplified_root.is_Integer
                or simplified_root.is_Rational
                or simplified_root.is_Float
            ):
                return True

            try:
                for power_expr in simplified_root.atoms(Pow):
                    exponent = getattr(power_expr, "exp", None)
                    if isinstance(exponent, Rational) and int(exponent.q) > 2:
                        return False
            except Exception:
                return False

            root_latex = latex(simplified_root)
            blocked_tokens = ("sqrt[3]", "sqrt[4]", "RootOf", "\\zeta")
            return not any(token in root_latex for token in blocked_tokens)

        linear_info = self._detect_linear_recurrence(
            self.proc_def, self._find_recursive_calls(self.proc_def)
        )
        if not linear_info or not linear_info.get("is_linear"):
            return {
                "success": False,
                "reason": "No es una recurrencia lineal con desplazamientos constantes",
            }

        self.proof_steps.append(
            {
                "id": "characteristic_start",
                "text": "\\text{Aplicando Método de Ecuación Característica}",
            }
        )

        coefficients = linear_info["coefficients"]
        max_offset = linear_info["max_offset"]
        g_n_str = str(linear_info.get("g_n", "0"))
        is_homogeneous = _is_zero_g(g_n_str)

        recurrence_terms: List[str] = []
        for offset in sorted(coefficients):
            coeff = coefficients[offset]
            if coeff == 1:
                recurrence_terms.append(f"T(n-{offset})")
            else:
                recurrence_terms.append(f"{coeff} \\cdot T(n-{offset})")

        homogeneous_form = f"T(n) = {' + '.join(recurrence_terms)}"
        recurrence_form_expanded = (
            homogeneous_form if is_homogeneous else f"{homogeneous_form} + {g_n_str}"
        )

        base_cases = self._detect_base_cases(self.proc_def)
        x = Symbol("x", real=True)
        n = Symbol("n", integer=True)

        char_eq_expr = x**max_offset - sum(
            coeff * x ** (max_offset - offset) for offset, coeff in coefficients.items()
        )
        char_eq_expr_simplified = simplify(char_eq_expr)
        char_eq_latex = latex(char_eq_expr_simplified) + " = 0"

        self.proof_steps.append(
            {
                "id": "characteristic_eq",
                "text": (
                    f"\\text{{De }} {recurrence_form_expanded} "
                    f"\\text{{se usa la parte homogénea y se obtiene }} {char_eq_latex}"
                ),
            }
        )

        try:
            root_mult_map = sympy_roots(char_eq_expr_simplified, x)
        except Exception:
            root_mult_map = {}

        if not root_mult_map:
            try:
                roots_from_solve = solve(char_eq_expr_simplified, x)
            except Exception as exc:
                return {
                    "success": False,
                    "reason": f"Error resolviendo ecuación característica: {str(exc)}",
                }
            for root_value in roots_from_solve:
                root_simplified = simplify(root_value)
                root_mult_map[root_simplified] = int(root_mult_map.get(root_simplified, 0)) + 1

        if not root_mult_map:
            return {
                "success": False,
                "reason": "No se pudieron calcular raíces de la ecuación característica",
            }

        root_entries: List[Dict[str, Any]] = []
        for root_expr, multiplicity in root_mult_map.items():
            root_simplified = simplify(root_expr)
            root_entries.append(
                {
                    "root_expr": root_simplified,
                    "root_latex": latex(root_simplified),
                    "multiplicity": int(multiplicity),
                    "magnitude": _root_magnitude(root_simplified),
                }
            )

        root_entries.sort(key=lambda item: item["magnitude"], reverse=True)
        roots_info = [
            {"root": entry["root_latex"], "multiplicity": entry["multiplicity"]}
            for entry in root_entries
        ]

        has_complex_root_representation = any(
            bool(entry["root_expr"].has(I) or entry["root_expr"].is_real is False)
            for entry in root_entries
        )

        # Construcción de solución homogénea general (considera multiplicidades reales).
        constant_symbols: List[Symbol] = []
        homogeneous_expr: Expr = Integer(0)
        constant_index = 1
        for entry in root_entries:
            for power in range(entry["multiplicity"]):
                c_symbol = Symbol(f"C{constant_index}")
                constant_symbols.append(c_symbol)
                homogeneous_expr += c_symbol * (n**power) * (entry["root_expr"] ** n)
                constant_index += 1

        if homogeneous_expr == 0:
            fallback_constant = Symbol("C1")
            constant_symbols = [fallback_constant]
            homogeneous_expr = fallback_constant

        homogeneous_display_expr = _choose_simplest_expression(homogeneous_expr)
        homogeneous_sol = latex(homogeneous_display_expr)

        particular_supported = is_homogeneous
        particular_expr: Optional[Expr] = None
        particular_sol: Optional[str] = None

        if not is_homogeneous:
            g_constant = _parse_constant_g(g_n_str)
            if g_constant is not None:
                multiplicity_at_one = 0
                for entry in root_entries:
                    try:
                        if simplify(entry["root_expr"] - 1) == 0:
                            multiplicity_at_one = int(entry["multiplicity"])
                            break
                    except Exception:
                        continue

                K = Symbol("K")
                trial_particular = K * (n**multiplicity_at_one)
                recurrence_balance = simplify(
                    trial_particular
                    - sum(
                        coeff * trial_particular.subs(n, n - offset)
                        for offset, coeff in coefficients.items()
                    )
                    - g_constant
                )

                equations: List[Expr] = []
                expanded_balance = expand(recurrence_balance)
                if expanded_balance != 0:
                    try:
                        polynomial = Poly(expanded_balance, n)
                        equations = [Eq(coef, 0) for coef in polynomial.all_coeffs()]
                    except Exception:
                        equations = [Eq(expanded_balance, 0)]

                try:
                    solved_k = solve(equations, [K], dict=True) if equations else [{K: Integer(0)}]
                except Exception:
                    solved_k = []

                if solved_k and K in solved_k[0]:
                    particular_expr = simplify(trial_particular.subs(K, solved_k[0][K]))
                    particular_sol = latex(particular_expr)
                    particular_supported = True

        general_expr = homogeneous_expr
        if not is_homogeneous and particular_supported and particular_expr is not None:
            general_expr = homogeneous_expr + particular_expr
        general_display_expr = _choose_simplest_expression(general_expr)
        general_solution = latex(general_display_expr)

        solved_constants: Dict[str, str] = {}
        resolved_general_expr = general_expr
        constants_resolved = False
        insufficient_base_conditions = False
        constant_resolution_skipped = False

        if constant_symbols:
            usable_base_cases: List[Tuple[int, Expr]] = []
            for key, value in base_cases.items():
                base_index = _extract_base_case_index(key)
                if base_index is None:
                    continue
                try:
                    usable_base_cases.append((base_index, sympify(value)))
                except Exception:
                    continue

            usable_base_cases.sort(key=lambda item: item[0])
            if len(usable_base_cases) >= len(constant_symbols):
                can_attempt_exact_solving = len(constant_symbols) <= 2 or all(
                    _root_is_symbolically_simple(entry["root_expr"]) for entry in root_entries
                )
                if can_attempt_exact_solving:
                    equations = [
                        Eq(simplify(general_expr.subs(n, base_index)), base_value)
                        for base_index, base_value in usable_base_cases[: len(constant_symbols)]
                    ]
                    try:
                        solved_constants_raw = solve(equations, constant_symbols, dict=True)
                    except Exception:
                        solved_constants_raw = []

                    if solved_constants_raw:
                        solved_map = solved_constants_raw[0]
                        resolved_general_expr = simplify(general_expr.subs(solved_map))
                        constants_resolved = True
                        solved_constants = {
                            latex(symbol): latex(simplify(value))
                            for symbol, value in solved_map.items()
                        }
                    elif usable_base_cases:
                        insufficient_base_conditions = True
                else:
                    # Guard de rendimiento para sistemas simbólicos pesados (p.ej. Tribonacci con raíces cúbicas).
                    constant_resolution_skipped = True
                    insufficient_base_conditions = True
            elif usable_base_cases:
                insufficient_base_conditions = True

        closed_form_base_expr = resolved_general_expr if constants_resolved else general_expr
        rsolve_candidate_expr: Optional[Expr] = None
        if constants_resolved:
            rsolve_candidate_expr = _try_closed_form_with_rsolve(
                coeffs=coefficients,
                g_raw=g_n_str,
                base_case_map=base_cases if base_cases else {},
                order=max_offset,
            )
        closed_form_expr = _choose_simplest_expression(
            closed_form_base_expr,
            extra_candidates=(
                [rsolve_candidate_expr] if rsolve_candidate_expr is not None else None
            ),
        )
        closed_form = latex(closed_form_expr)
        simplification_partial = (
            (not is_homogeneous and not particular_supported)
            or insufficient_base_conditions
            or (bool(base_cases) and bool(constant_symbols) and not constants_resolved)
        )

        dominant_root = root_entries[0]["root_latex"] if root_entries else None
        growth_rate = None
        if root_entries:
            try:
                growth_rate = float(root_entries[0]["root_expr"].evalf())
            except Exception:
                growth_rate = None

        theta_result = "\\Theta(1)"
        if root_entries:
            dominant_magnitude = root_entries[0]["magnitude"]
            same_scale_roots = [
                entry
                for entry in root_entries
                if abs(entry["magnitude"] - dominant_magnitude) <= 1e-9
            ]
            dominant_multiplicity = max(
                (entry["multiplicity"] for entry in same_scale_roots), default=1
            )
            particular_degree = 0
            if particular_expr is not None and particular_expr.has(n):
                try:
                    particular_degree = max(int(Poly(expand(particular_expr), n).degree()), 0)
                except Exception:
                    particular_degree = 1

            if dominant_magnitude > 1 + 1e-9:
                dominant_abs_latex = latex(simplify(Abs(root_entries[0]["root_expr"])))
                exponential_term = _pow_n(dominant_abs_latex)
                if dominant_multiplicity > 1:
                    theta_result = (
                        f"\\Theta(n^{dominant_multiplicity - 1} \\cdot {exponential_term})"
                    )
                else:
                    theta_result = f"\\Theta({exponential_term})"
            else:
                polynomial_degree = max(dominant_multiplicity - 1, particular_degree, 0)
                if polynomial_degree == 0:
                    theta_result = "\\Theta(1)"
                elif polynomial_degree == 1:
                    theta_result = "\\Theta(n)"
                else:
                    theta_result = f"\\Theta(n^{polynomial_degree})"

        dp_validation = self._build_dp_validation(
            self.proc_def,
            self._find_recursive_calls(self.proc_def),
            linear_info,
        )
        is_dp_linear = dp_validation.get("applicable", False)

        dp_version = None
        dp_optimized_version = None
        dp_equivalence = ""
        if is_dp_linear:
            dp_code = self._generate_dp_code(coefficients, max_offset)
            dp_code_optimized = self._generate_optimized_dp_code(coefficients, max_offset, g_n_str)
            recursive_complexity = self._calculate_recursive_complexity(coefficients, max_offset)
            dp_space_optimized = "O(1)" if max_offset <= 3 else f"O({max_offset})"

            dp_version = {
                "code": dp_code,
                "time_complexity": "O(n)",
                "space_complexity": "O(n)",
                "recursive_complexity": recursive_complexity,
                "pattern": dp_validation.get("primary_pattern", "tabulation"),
            }
            dp_optimized_version = {
                "code": dp_code_optimized,
                "time_complexity": "O(n)",
                "space_complexity": dp_space_optimized,
                "pattern": (
                    "rolling_window"
                    if dp_validation.get("primary_pattern") == "rolling_window"
                    else "tabulation"
                ),
            }
            dp_equivalence = (
                "Las raíces de la ecuación característica corresponden a los valores propios "
                "de la transición lineal del sistema DP. La solución cerrada matemática "
                "equivale a la solución iterativa mediante programación dinámica."
            )

        has_early_return = self._detect_early_return()
        if has_early_return and self.mode == "best":
            theta_result = "\\Theta(1)"
            self.proof_steps.append(
                {
                    "id": "best_case",
                    "text": "\\text{Mejor caso: } \\Theta(1) \\text{ (return temprano detectado)}",
                }
            )

        step_bundle = build_characteristic_step_bundle(
            StepContext(
                locale=self.locale,
                recurrence_form=recurrence_form_expanded,
                order=max_offset,
                is_linear=bool(linear_info.get("is_linear")),
                g_n=g_n_str,
                is_homogeneous=is_homogeneous,
                homogeneous_form=homogeneous_form,
                equation=char_eq_latex,
                roots=roots_info,
                homogeneous_solution=homogeneous_sol,
                particular_solution=particular_sol,
                particular_supported=particular_supported,
                general_solution=general_solution,
                base_cases=base_cases if base_cases else {},
                closed_form=closed_form,
                theta=theta_result,
                has_complex_root_representation=has_complex_root_representation,
                simplification_partial=simplification_partial,
                solved_constants=solved_constants,
                required_constants=len(constant_symbols),
                constant_resolution_skipped=constant_resolution_skipped,
            )
        )

        result = {
            "method": "characteristic_equation",
            "is_dp_linear": is_dp_linear,
            "equation": char_eq_latex,
            "roots": roots_info,
            "dominant_root": dominant_root,
            "growth_rate": growth_rate,
            "solved_by": "characteristic_equation",
            "homogeneous_solution": homogeneous_sol,
            "particular_solution": particular_sol,
            "general_solution": general_solution,
            "base_cases": base_cases if base_cases else None,
            "closed_form": closed_form,
            "dp_validation": dp_validation,
            "dp_version": dp_version,
            "dp_optimized_version": dp_optimized_version,
            "dp_equivalence": dp_equivalence,
            "theta": theta_result,
            "has_early_return": has_early_return,
            "step_by_step": step_bundle,
            "constant_resolution": {
                "status": (
                    "solved"
                    if constants_resolved
                    else ("partial" if constant_resolution_skipped else "unresolved")
                ),
                "reason": (
                    "symbolic_solver_guard"
                    if constant_resolution_skipped
                    else (
                        "insufficient_base_conditions"
                        if insufficient_base_conditions and not constants_resolved
                        else None
                    )
                ),
            },
        }

        self.proof_steps.append(
            {
                "id": "characteristic_solution",
                "text": f"\\text{{Solución: }} T(n) = {theta_result}",
            }
        )

        if is_dp_linear:
            self.proof_steps.append(
                {
                    "id": "dp_detection",
                    "text": "\\text{La validación previa confirma que esta recurrencia encaja como caso de Programación Dinámica}",
                }
            )
        else:
            self.proof_steps.append(
                {
                    "id": "dp_rejected",
                    "text": "\\text{La validación previa descarta presentar esta recurrencia como Programación Dinámica}",
                }
            )
        if constant_resolution_skipped:
            self.proof_steps.append(
                {
                    "id": "base_conditions_partial_symbolic_guard",
                    "text": "\\text{Condiciones base detectadas, pero se omite solve exacto de constantes por guard de rendimiento simbólico.}",
                }
            )

        return {"success": True, "characteristic_equation": result}

    def _generate_dp_code(self, coefficients: Dict[int, int], max_offset: int) -> str:
        """
        Genera código pseudocódigo para versión DP del algoritmo.

        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k

        Returns:
            Código pseudocódigo en string
        """
        # Determinar casos base
        base_cases = []
        for i in range(max_offset):
            base_cases.append(f"    dp[{i}] = T{i}  // Caso base")

        # Construir bucle principal
        loop_body = "    dp[i] = "
        terms = []
        for offset, coeff in sorted(coefficients.items()):
            if coeff == 1:
                terms.append(f"dp[i-{offset}]")
            else:
                terms.append(f"{coeff} * dp[i-{offset}]")

        loop_body += " + ".join(terms)

        code = f"""FUNCIÓN dp_solve(n):
    SI n <= {max_offset-1} ENTONCES
        RETORNAR caso_base[n]
    
    // Inicializar tabla DP
    dp[0..n] = 0
    
    // Casos base
{chr(10).join(base_cases)}
    
    // Llenar tabla bottom-up
    PARA i = {max_offset} HASTA n HACER
{loop_body}
    FIN PARA
    
    RETORNAR dp[n]
FIN FUNCIÓN"""

        return code

    def _generate_optimized_dp_code(
        self, coefficients: Dict[int, int], max_offset: int, g_n_str: str = "0"
    ) -> str:
        """
        Genera código pseudocódigo para versión DP optimizada con O(1) espacio.

        En lugar de usar una tabla completa, usa solo variables auxiliares.
        Ejemplo para Fibonacci: usar solo a=0, b=1 en el loop.

        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k
            g_n_str: Término no homogéneo g(n) para determinar si incluir +g(i) en el código

        Returns:
            Código pseudocódigo optimizado en string
        """
        if max_offset == 1:
            # Caso simple: T(n) = cT(n-1) + g(n)
            coeff = coefficients.get(1, 1)
            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    
    // Versión optimizada O(1) espacio
    prev = caso_base[0]  // T(0)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 1 HASTA n HACER
        actual = {coeff} * prev + g(i)  // T(i) = {coeff}T(i-1) + g(i)
        prev = actual
    FIN PARA
    
    RETORNAR prev
FIN FUNCIÓN"""
        elif max_offset == 2:
            # Caso común: T(n) = c1T(n-1) + c2T(n-2) + g(n) (ej: Fibonacci)
            coeff1 = coefficients.get(1, 1)
            coeff2 = coefficients.get(2, 1)

            # Determinar si es homogénea (g(n) = 0)
            g_n_clean = g_n_str.strip().lower() if g_n_str else "0"
            is_homogeneous = (
                g_n_clean == "0"
                or g_n_clean == "\\theta(0)"
                or g_n_clean == "theta(0)"
                or (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0))
            )

            # Construir término g(n) solo si no es homogénea
            g_term = "" if is_homogeneous else " + g(i)"
            g_comment = "" if is_homogeneous else " + g(i)"

            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    SI n = 1 ENTONCES
        RETORNAR caso_base[1]
    
    // Versión optimizada O(1) espacio
    // Usar solo dos variables auxiliares
    a = caso_base[0]  // T(0)
    b = caso_base[1]  // T(1)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 2 HASTA n HACER
        temp = {coeff1} * b + {coeff2} * a{g_term}  // T(i) = {coeff1}T(i-1) + {coeff2}T(i-2){g_comment}
        a = b
        b = temp
    FIN PARA
    
    RETORNAR b
FIN FUNCIÓN"""
        elif max_offset == 3:
            # Caso: T(n) = c1T(n-1) + c2T(n-2) + c3T(n-3) + g(n) (ej: Tribonacci)
            coeff1 = coefficients.get(1, 1)
            coeff2 = coefficients.get(2, 1)
            coeff3 = coefficients.get(3, 1)

            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    SI n = 1 ENTONCES
        RETORNAR caso_base[1]
    SI n = 2 ENTONCES
        RETORNAR caso_base[2]
    
    // Versión optimizada O(1) espacio
    // Usar solo tres variables auxiliares
    a = caso_base[0]  // T(0)
    b = caso_base[1]  // T(1)
    c = caso_base[2]  // T(2)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 3 HASTA n HACER
        temp = {coeff1} * c + {coeff2} * b + {coeff3} * a + g(i)  // T(i) = {coeff1}T(i-1) + {coeff2}T(i-2) + {coeff3}T(i-3) + g(i)
        a = b
        b = c
        c = temp
    FIN PARA
    
    RETORNAR c
FIN FUNCIÓN"""
        else:
            # Caso general: usar un arreglo circular pequeño (solo max_offset elementos)
            # Aunque técnicamente es O(k) espacio, es O(1) relativo a n
            terms = []
            for offset in sorted(coefficients.keys()):
                coeff = coefficients[offset]
                if coeff == 1:
                    terms.append(f"dp[(i-{offset}) % {max_offset}]")
                else:
                    terms.append(f"{coeff} * dp[(i-{offset}) % {max_offset}]")

            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= {max_offset-1} ENTONCES
        RETORNAR caso_base[n]
    
    // Versión optimizada O({max_offset}) espacio (arreglo circular)
    // Inicializar arreglo circular pequeño
    dp[0..{max_offset-1}] = 0
    
    // Casos base
"""
            for i in range(max_offset):
                code += f"    dp[{i}] = caso_base[{i}]  // Caso base T({i})\n"

            code += f"""
    // Llenar bottom-up con arreglo circular
    PARA i = {max_offset} HASTA n HACER
        dp[i % {max_offset}] = {' + '.join(terms)} + g(i)  // T(i) = ... + g(i)
    FIN PARA
    
    RETORNAR dp[n % {max_offset}]
FIN FUNCIÓN"""

        return code

    def _calculate_recursive_complexity(self, coefficients: Dict[int, int], max_offset: int) -> str:
        """
        Calcula la complejidad de la versión recursiva.

        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k

        Returns:
            Complejidad en notación O
        """
        # Contar número total de llamadas recursivas
        total_calls = sum(coefficients.values())

        if total_calls == 1:
            return "O(n)"
        elif total_calls == 2:
            return "O(2^n)"
        else:
            return f"O({total_calls}^n)"

    # ============================================================================
    # MÉTODO DE ITERACIÓN (UNROLLING)
    # ============================================================================

    def _detect_iteration_method(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Detecta si debe usarse automáticamente el Método de Iteración (V1).

        Cobertura V1 (estricta):
        - Solo recurrencias equivalentes a T(n)=T(n-1)+g(n)
        - Una única llamada recursiva
        - Desplazamiento unitario (n-1)
        - Coeficiente 1 para T(n-1)

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas

        Returns:
            True si la forma cumple la cobertura V1 de Iteración
        """
        if not recursive_calls:
            return False

        # V1: no soporta múltiples llamadas ni órdenes > 1.
        if len(recursive_calls) != 1:
            return False

        subproblem_info = self._analyze_subproblem_type(recursive_calls[0], proc_def)
        if not subproblem_info or subproblem_info.get("type") != "subtraction":
            return False

        # Debe ser desplazamiento unitario: n-1.
        factor = subproblem_info.get("factor")
        pattern = str(subproblem_info.get("pattern", "")).replace(" ", "")
        is_unit_shift = factor == 1 or pattern == "n-1"
        if not is_unit_shift:
            return False

        # Verificación adicional con extractor lineal, cuando está disponible.
        linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
        if linear_info:
            coefficients = linear_info.get("coefficients", {}) or {}
            max_offset = int(linear_info.get("max_offset", 1))
            if max_offset != 1:
                return False
            if coefficients.get(1, 1) != 1:
                return False

        return True

    def _analyze_subproblem_type(
        self, call: Dict[str, Any], proc_def: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Analiza el tipo de subproblema en una llamada recursiva para Método de Iteración.

        Clasifica el subproblema como:
        - "subtraction": n-1, n-k, n-c
        - "division": n/2, n/c
        - "range_halving": (inicio + fin) / 2
        - "unknown": No se puede clasificar

        Args:
            call: Nodo Call recursivo
            proc_def: Nodo ProcDef del procedimiento

        Returns:
            {"type": str, "pattern": str, "factor": float|int} o None
        """
        params = proc_def.get("params", [])
        if not params:
            return None

        args = call.get("args", [])
        if not args:
            return None

        # Estrategia 0: Detectar reducción de rango cuando los parámetros son inicio/fin
        # Ejemplo: invertirArray(A, inicio, fin) con llamada (A, inicio + 1, fin - 1)
        # El tamaño es fin - inicio + 1, y se reduce en 2 (inicio + 1, fin - 1)
        range_reduction = self._detect_range_reduction(args, params)
        if range_reduction:
            return range_reduction

        # Estrategia 0.1: Detectar reducción índice-límite (sufijo/prefijo) cuando solo
        # un índice se mueve (i <- i + 1) y el límite permanece constante (n).
        # Ejemplos:
        # - linearSearchRec(A, x, i, n) -> linearSearchRec(A, x, i+1, n) con base IF (i > n)
        # - selectionSortRec(A, inicio, n) -> selectionSortRec(A, inicio+1, n) con base IF (inicio >= n)
        index_bound_reduction = self._detect_index_bound_reduction(args, params, proc_def)
        if index_bound_reduction:
            return index_bound_reduction

        # Estrategia 0.5: Detectar búsqueda binaria (izq, medio-1) o (medio+1, der) con medio=(izq+der)/2
        binary_search_reduction = self._detect_binary_search_range_reduction(args, params, proc_def)
        if binary_search_reduction:
            return binary_search_reduction

        # Estrategia 0.6: Detectar reducción por MOD (Euclides, GCD): F(a,b) -> F(b, a MOD b)
        if len(params) >= 2 and len(args) >= 2:
            param_names = set()
            for p in params:
                if isinstance(p, dict):
                    param_names.add((p.get("name") or "").strip().lower())
                else:
                    param_names.add(str(p).strip().lower())
            for arg in args:
                if isinstance(arg, dict) and arg.get("type", "").lower() == "binary":
                    if str(arg.get("op", "")).lower() == "mod":
                        left = arg.get("left", {})
                        right = arg.get("right", {})
                        if isinstance(left, dict) and isinstance(right, dict):
                            ln = (left.get("name") or left.get("id") or "").strip().lower()
                            rn = (right.get("name") or right.get("id") or "").strip().lower()
                            if ln in param_names and rn in param_names:
                                return {"type": "mod", "pattern": "mod", "factor": 1}

        # Obtener el nombre del primer parámetro (usualmente el tamaño)
        first_param = params[0]
        if isinstance(first_param, dict):
            first_param_name = first_param.get("name", "")
            # Verificar si el primer parámetro es un array (tiene corchetes en el nombre o es arrayParam)
            first_param_is_array = (
                "[" in first_param_name or first_param.get("type", "").lower() == "arrayparam"
            )
        else:
            first_param_name = str(first_param)
            first_param_is_array = "[" in first_param_name

        # Si el primer parámetro es un array, buscar el tamaño en los siguientes parámetros
        # Ejemplo: sumaArray(A[n], n) -> el tamaño es el segundo parámetro 'n'
        size_param_index = 0
        size_param_name = first_param_name

        if first_param_is_array and len(params) > 1:
            # El tamaño probablemente está en el segundo parámetro
            size_param = params[1]
            if isinstance(size_param, dict):
                size_param_name = size_param.get("name", "")
            else:
                size_param_name = str(size_param)
            size_param_index = 1
        elif not first_param_is_array and len(params) > 1:
            # Si el primer parámetro NO es un array pero hay dos parámetros,
            # verificar si el segundo parámetro parece ser el tamaño
            # (nombres comunes como 'n', 'size', 'length', etc.)
            second_param = params[1]
            if isinstance(second_param, dict):
                second_param_name = second_param.get("name", "").lower()
                # Si el segundo parámetro tiene un nombre común de tamaño, usarlo
                if second_param_name in ["n", "size", "length", "len", "tam", "tamaño"]:
                    size_param_name = second_param.get("name", "")
                    size_param_index = 1
                # También verificar si el segundo argumento en la llamada recursiva está modificado
                # (es una expresión binaria con -, /, etc.) mientras que el primero no
                elif len(args) > 1:
                    first_arg = args[0] if len(args) > 0 else None
                    second_arg = args[1] if len(args) > 1 else None
                    # Si el segundo argumento es una expresión (modificado) y el primero es un identificador simple
                    if (
                        isinstance(second_arg, dict)
                        and second_arg.get("type", "").lower() in ["binary", "unary"]
                        and isinstance(first_arg, dict)
                        and first_arg.get("type", "").lower() == "identifier"
                    ):
                        # El segundo parámetro es probablemente el tamaño
                        size_param_name = second_param.get("name", "")
                        size_param_index = 1

        # Analizar argumentos buscando el que corresponde al tamaño
        # Si el primer parámetro es array, buscar en args[1], sino en args[0]
        # Pero si detectamos que el tamaño está en el segundo parámetro, buscar en args[1]
        size_arg_index = size_param_index if size_param_index < len(args) else 0
        size_arg = args[size_arg_index] if size_arg_index < len(args) else None

        # Si hay dos parámetros y no detectamos automáticamente cuál es el tamaño,
        # probar ambos argumentos para ver cuál está siendo modificado
        if not first_param_is_array and len(params) == 2 and len(args) == 2:
            first_arg = args[0] if len(args) > 0 else None
            second_arg = args[1] if len(args) > 1 else None

            # Verificar si el segundo argumento está modificado y el primero no
            second_arg_modified = isinstance(second_arg, dict) and second_arg.get(
                "type", ""
            ).lower() in ["binary", "unary"]
            first_arg_simple = (
                isinstance(first_arg, dict) and first_arg.get("type", "").lower() == "identifier"
            )

            if second_arg_modified and first_arg_simple:
                # El segundo parámetro es probablemente el tamaño
                size_param_name = (
                    params[1].get("name", "") if isinstance(params[1], dict) else str(params[1])
                )
                size_arg_index = 1
                size_arg = second_arg

        if size_arg and isinstance(size_arg, dict):
            arg_type = size_arg.get("type", "").lower()

            # Caso: field access (ej: nodo.siguiente) - para listas enlazadas, esto es n-1
            if arg_type == "field":
                # Verificar si el target del field access es el parámetro original
                target = size_arg.get("target", {})
                if isinstance(target, dict):
                    target_name = target.get("name", "") or target.get("id", "")
                    # Si el target es el primer parámetro (el objeto/nodo), es probablemente una lista enlazada
                    if target_name == first_param_name:
                        field_name = size_arg.get("name", "") or size_arg.get("field", "")
                        field_name_lower = str(field_name).lower()
                        # Campos comunes de listas enlazadas (siguiente, next, etc.) → n-1
                        if field_name_lower in ["siguiente", "next", "proximo", "prox"]:
                            return {
                                "type": "subtraction",
                                "pattern": "n-1",
                                "factor": 1,
                            }
                        # Campos de árboles binarios (izquierda, derecha, left, right) → n/2
                        elif field_name_lower in [
                            "izquierda",
                            "derecha",
                            "left",
                            "right",
                            "izq",
                            "der",
                        ]:
                            return {"type": "division", "pattern": "n/2", "factor": 2}

            # Caso: n - 1 o n - k (BinaryExpression con operador -)
            elif arg_type == "binary":
                op = size_arg.get("op", "")

                if op == "-":
                    left = size_arg.get("left", {})
                    right = size_arg.get("right", {})

                    # Verificar que left es el parámetro de tamaño
                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == size_param_name:
                            # Extraer el valor de resta
                            if (
                                isinstance(right, dict)
                                and right.get("type", "").lower() == "literal"
                            ):
                                value = right.get("value", 1)
                                return {
                                    "type": "subtraction",
                                    "pattern": f"n-{value}",
                                    "factor": value,
                                }
                            elif (
                                isinstance(right, dict)
                                and right.get("type", "").lower() == "identifier"
                            ):
                                # Es n - k donde k es una variable
                                return {
                                    "type": "subtraction",
                                    "pattern": "n-k",
                                    "factor": 1,  # Asumimos 1 por defecto
                                }

                # Caso: n / 2 o n / c (BinaryExpression con operador /)
                elif op in ["/", "div"]:
                    left = size_arg.get("left", {})
                    right = size_arg.get("right", {})

                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == size_param_name:
                            # Extraer el factor de división
                            if (
                                isinstance(right, dict)
                                and right.get("type", "").lower() == "literal"
                            ):
                                value = right.get("value", 2)
                                return {
                                    "type": "division",
                                    "pattern": f"n/{value}",
                                    "factor": value,
                                }
                        # También verificar si left es una expresión (inicio + fin) / 2
                        elif self._is_range_halving_pattern(size_arg, params):
                            return {
                                "type": "range_halving",
                                "pattern": "(inicio+fin)/2",
                                "factor": 2,
                            }
                # Caso: a MOD b (Euclides, GCD): el tamaño se reduce (segundo parámetro → primero mod segundo)
                elif str(op).lower() == "mod":
                    left = size_arg.get("left", {})
                    right = size_arg.get("right", {})
                    if isinstance(left, dict) and isinstance(right, dict):
                        left_name = (left.get("name") or left.get("id") or "").strip()
                        right_name = (right.get("name") or right.get("id") or "").strip()
                        param_names = set()
                        for p in params:
                            if isinstance(p, dict):
                                param_names.add((p.get("name") or "").strip())
                            else:
                                param_names.add(str(p).strip())
                        if left_name in param_names and right_name in param_names:
                            return {"type": "mod", "pattern": "mod", "factor": 1}

        # Fallback: Si no se detectó nada y hay dos parámetros, probar con el segundo argumento
        if not first_param_is_array and len(params) == 2 and len(args) == 2:
            # Si el primer argumento no dio resultado, probar con el segundo
            if size_arg_index == 0:
                second_arg = args[1] if len(args) > 1 else None
                if isinstance(second_arg, dict):
                    second_arg_type = second_arg.get("type", "").lower()
                    if second_arg_type == "binary":
                        op = second_arg.get("op", "")
                        if op == "-":
                            left = second_arg.get("left", {})
                            right = second_arg.get("right", {})
                            if isinstance(left, dict):
                                left_name = left.get("name", "") or left.get("id", "")
                                second_param = params[1]
                                second_param_name = (
                                    second_param.get("name", "")
                                    if isinstance(second_param, dict)
                                    else str(second_param)
                                )
                                if left_name == second_param_name:
                                    if (
                                        isinstance(right, dict)
                                        and right.get("type", "").lower() == "literal"
                                    ):
                                        value = right.get("value", 1)
                                        return {
                                            "type": "subtraction",
                                            "pattern": f"n-{value}",
                                            "factor": value,
                                        }
                        elif op in ["/", "div"]:
                            left = second_arg.get("left", {})
                            right = second_arg.get("right", {})
                            if isinstance(left, dict):
                                left_name = left.get("name", "") or left.get("id", "")
                                second_param = params[1]
                                second_param_name = (
                                    second_param.get("name", "")
                                    if isinstance(second_param, dict)
                                    else str(second_param)
                                )
                                if left_name == second_param_name:
                                    if (
                                        isinstance(right, dict)
                                        and right.get("type", "").lower() == "literal"
                                    ):
                                        value = right.get("value", 2)
                                        return {
                                            "type": "division",
                                            "pattern": f"n/{value}",
                                            "factor": value,
                                        }

            # Caso: parámetro directo sin modificación (n)
            elif arg_type == "identifier":
                arg_name = size_arg.get("name", "") or size_arg.get("id", "")
                if arg_name == size_param_name:
                    # No es decrease-and-conquer, es recursión directa
                    return None

        return None

    def _is_range_halving_pattern(self, expr: Dict[str, Any], params: List[Any]) -> bool:
        """
        Detecta si una expresión es del tipo (inicio + fin) / 2.

        Args:
            expr: Expresión binaria
            params: Parámetros del procedimiento

        Returns:
            True si es un patrón de range halving
        """
        if not isinstance(expr, dict):
            return False

        op = expr.get("op", "")
        if op == "/":
            left = expr.get("left", {})
            right = expr.get("right", {})

            # Verificar que right es 2
            if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                if right.get("value") == 2:
                    # Verificar que left es una suma de dos parámetros
                    if isinstance(left, dict) and left.get("op", "") == "+":
                        return True

        return False

    def _detect_binary_search_range_reduction(
        self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Detecta patrón de búsqueda binaria: (izq, medio-1) o (medio+1, der) con medio=(izq+der)/2.
        El tamaño del subproblema es n/2.
        """
        if len(args) < 4 or len(params) < 4:
            return None
        param_names = []
        for p in params:
            if isinstance(p, dict):
                param_names.append((p.get("name") or "").lower())
            else:
                param_names.append(str(p).lower())
        inicio_keywords = ["inicio", "izq", "left", "start", "begin", "low"]
        fin_keywords = ["fin", "der", "right", "end", "high"]
        inicio_idx = next(
            (i for i, n in enumerate(param_names) if any(k in n for k in inicio_keywords)),
            None,
        )
        fin_idx = next(
            (i for i, n in enumerate(param_names) if any(k in n for k in fin_keywords)),
            None,
        )
        if inicio_idx is None or fin_idx is None or inicio_idx >= len(args) or fin_idx >= len(args):
            return None
        inicio_arg = args[inicio_idx]
        fin_arg = args[fin_idx]
        body = proc_def.get("body", {}) or {}
        stmts = body.get("body", []) if isinstance(body, dict) else []
        medio_var = None
        for stmt in stmts:
            if not isinstance(stmt, dict) or stmt.get("type", "").lower() != "assign":
                continue
            target = stmt.get("target", {})
            value = stmt.get("value", {})
            if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                tname = (target.get("name") or "").lower()
                if tname in ["medio", "mid", "middle", "mitad"]:
                    if isinstance(value, dict) and value.get("type", "").lower() == "binary":
                        if value.get("op", "") == "/":
                            left = value.get("left", {})
                            right = value.get("right", {})
                            if (
                                isinstance(right, dict)
                                and right.get("type", "").lower() == "literal"
                            ):
                                if right.get("value") == 2:
                                    if isinstance(left, dict) and left.get("op", "") == "+":
                                        medio_var = target.get("name", "")
                                        break
        if not medio_var:
            return None
        is_division = False
        if isinstance(fin_arg, dict) and fin_arg.get("type", "").lower() == "binary":
            if fin_arg.get("op", "") == "-":
                left = fin_arg.get("left", {})
                if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                    if (left.get("name") or "").lower() == medio_var.lower():
                        is_division = True
        if isinstance(inicio_arg, dict) and inicio_arg.get("type", "").lower() == "binary":
            if inicio_arg.get("op", "") == "+":
                right = inicio_arg.get("right", {})
                if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                    if right.get("value") == 1:
                        left = inicio_arg.get("left", {})
                        if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                            if (left.get("name") or "").lower() == medio_var.lower():
                                is_division = True
        if is_division:
            return {"type": "division", "pattern": "n/2", "factor": 2}
        return None

    def _detect_range_reduction(
        self, args: List[Any], params: List[Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Detecta reducción de rango cuando los parámetros son inicio/fin.

        Ejemplo: invertirArray(A, inicio, fin) con llamada (A, inicio + 1, fin - 1)
        El tamaño es fin - inicio + 1, y se reduce en 2.

        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento

        Returns:
            {"type": "subtraction", "pattern": str, "factor": int} o None
        """
        if len(args) < 3 or len(params) < 3:
            return None

        # Buscar parámetros que parezcan inicio/fin (ignorar el primero que suele ser el array)
        param_info = []
        for i, param in enumerate(params[1:], start=1):  # Saltar el primer parámetro (array)
            if isinstance(param, dict):
                param_name = param.get("name", "")
            else:
                param_name = str(param)
            param_info.append({"index": i, "name": param_name, "name_lower": param_name.lower()})

        # Nombres comunes para inicio/fin
        inicio_keywords = ["inicio", "izq", "left", "start", "begin", "low"]
        fin_keywords = ["fin", "der", "right", "end", "high"]

        # Buscar si hay un par inicio/fin en los parámetros
        inicio_param = None
        fin_param = None

        for param in param_info:
            name_lower = param["name_lower"]
            if any(keyword in name_lower for keyword in inicio_keywords):
                inicio_param = param
            elif any(keyword in name_lower for keyword in fin_keywords):
                fin_param = param

        if inicio_param is None or fin_param is None:
            return None

        inicio_idx = inicio_param["index"]
        fin_idx = fin_param["index"]

        # Verificar que los argumentos correspondientes son expresiones binarias
        if inicio_idx >= len(args) or fin_idx >= len(args):
            return None

        inicio_arg = args[inicio_idx]
        fin_arg = args[fin_idx]

        # Verificar que inicio_arg es una suma (inicio + k)
        if not isinstance(inicio_arg, dict) or inicio_arg.get("type", "").lower() != "binary":
            return None

        inicio_op = inicio_arg.get("op", "")
        if inicio_op != "+":
            return None

        inicio_left = inicio_arg.get("left", {})
        inicio_right = inicio_arg.get("right", {})

        # Verificar que left es el parámetro inicio
        if isinstance(inicio_left, dict):
            inicio_left_name = (inicio_left.get("name") or inicio_left.get("id", "")).lower()
            if inicio_left_name != inicio_param["name_lower"]:
                return None

        # Extraer el valor de k de inicio + k
        if isinstance(inicio_right, dict) and inicio_right.get("type", "").lower() == "literal":
            k_value = inicio_right.get("value", 0)
        else:
            return None

        # Verificar que fin_arg es una resta (fin - k)
        if not isinstance(fin_arg, dict) or fin_arg.get("type", "").lower() != "binary":
            return None

        fin_op = fin_arg.get("op", "")
        if fin_op != "-":
            return None

        fin_left = fin_arg.get("left", {})
        fin_right = fin_arg.get("right", {})

        # Verificar que left es el parámetro fin
        if isinstance(fin_left, dict):
            fin_left_name = (fin_left.get("name") or fin_left.get("id", "")).lower()
            if fin_left_name != fin_param["name_lower"]:
                return None

        # Verificar que right es el mismo k
        if isinstance(fin_right, dict) and fin_right.get("type", "").lower() == "literal":
            fin_k_value = fin_right.get("value", 0)
            if fin_k_value != k_value:
                return None
        else:
            return None

        # El tamaño se reduce en 2k (inicio + k, fin - k)
        reduction = 2 * k_value

        return {"type": "subtraction", "pattern": f"n-{reduction}", "factor": reduction}

    def _detect_index_bound_reduction(
        self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Detecta una reducción de tamaño de la forma (bound - idx) cuando:
        - existe un parámetro 'idx' cuyo argumento recursivo es idx + k (k literal > 0),
        - existe un parámetro 'bound' cuyo argumento recursivo es el mismo bound (constante),
        - y hay evidencia estructural de caso base comparando idx vs bound (idx >= bound o idx > bound).

        Esto permite modelar recurrencias como:
        T(n) = T(n-1) + g(n) cuando el 'n' conceptual es (bound - idx + 1).
        """
        if not isinstance(proc_def, dict):
            return None
        if not isinstance(args, list) or not isinstance(params, list):
            return None
        if len(args) != len(params) or len(args) < 2:
            return None

        # Extraer nombres de parámetros (en minúsculas) y mapear índice -> nombre.
        param_names: List[str] = []
        for p in params:
            if isinstance(p, dict):
                param_names.append(str(p.get("name", "") or "").strip().lower())
            else:
                param_names.append(str(p).strip().lower())

        def _is_identifier(node: Any, name_lower: str) -> bool:
            return (
                isinstance(node, dict)
                and node.get("type", "").lower() == "identifier"
                and (node.get("name") or node.get("id") or "").strip().lower() == name_lower
            )

        def _is_plus_literal(node: Any, name_lower: str) -> Optional[int]:
            if not isinstance(node, dict) or node.get("type", "").lower() != "binary":
                return None
            if str(node.get("op", "")).strip() != "+":
                return None
            left = node.get("left", {})
            right = node.get("right", {})
            if not _is_identifier(left, name_lower):
                return None
            if not isinstance(right, dict) or right.get("type", "").lower() != "literal":
                return None
            try:
                k = int(right.get("value"))
            except Exception:
                return None
            return k if k > 0 else None

        # Buscar pares (idx, bound) candidatos.
        candidates: List[Tuple[str, str, int]] = []
        for i, (pname, arg) in enumerate(zip(param_names, args)):
            if not pname:
                continue
            k = _is_plus_literal(arg, pname)
            if k is None:
                continue
            # Encontrar algún bound que permanezca constante.
            for j, (bname, barg) in enumerate(zip(param_names, args)):
                if i == j or not bname:
                    continue
                if _is_identifier(barg, bname):
                    candidates.append((pname, bname, k))

        if not candidates:
            return None

        # Evidencia mínima: un IF con comparación idx vs bound (>, >=).
        def _has_guard(node: Any, idx_name: str, bound_name: str) -> bool:
            if isinstance(node, dict):
                if node.get("type", "") == "If":
                    test = node.get("test") or node.get("condition") or {}
                    if (
                        isinstance(test, dict)
                        and test.get("type", "").lower() == "binary"
                        and str(test.get("op", "")).strip() in {">", ">="}
                    ):
                        left = test.get("left", {})
                        right = test.get("right", {})
                        if _is_identifier(left, idx_name) and _is_identifier(right, bound_name):
                            return True
                    # seguir buscando en ramas
                    if _has_guard(node.get("consequent", {}), idx_name, bound_name):
                        return True
                    if _has_guard(node.get("alternate", {}), idx_name, bound_name):
                        return True
                for v in node.values():
                    if _has_guard(v, idx_name, bound_name):
                        return True
            elif isinstance(node, list):
                for it in node:
                    if _has_guard(it, idx_name, bound_name):
                        return True
            return False

        body = proc_def.get("body") or {}
        for idx_name, bound_name, k in candidates:
            if _has_guard(body, idx_name, bound_name):
                # Tamaño conceptual: (bound - idx + 1). Si idx aumenta k, el tamaño baja k.
                return {"type": "subtraction", "pattern": f"n-{k}", "factor": k}

        return None

    def _combines_multiple_results(
        self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]
    ) -> bool:
        """
        Verifica si el algoritmo combina múltiples resultados recursivos.

        Por ejemplo: return T(n/2) + T(n/2) no es válido para iteración.
        Pero: return T(n-1) + n es válido.

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas

        Returns:
            True si combina múltiples resultados recursivos
        """
        # Si hay más de una llamada recursiva, definitivamente combina múltiples resultados
        if len(recursive_calls) > 1:
            return True

        # Buscar returns que sumen múltiples llamadas recursivas
        body = proc_def.get("body", {})

        # Buscar nodos Return
        returns = self._find_return_statements(body)

        for ret in returns:
            ret_expr = ret.get("expr", {})
            if self._contains_multiple_recursive_calls(ret_expr, self.procedure_name):
                return True

        return False

    def _find_return_statements(self, node: Any) -> List[Dict[str, Any]]:
        """
        Encuentra todos los statements Return en el AST.

        Args:
            node: Nodo del AST

        Returns:
            Lista de nodos Return
        """
        returns = []

        if not isinstance(node, dict):
            return returns

        node_type = node.get("type", "")
        if node_type == "Return":
            returns.append(node)

        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    returns.extend(self._find_return_statements(item))
            elif isinstance(value, dict):
                returns.extend(self._find_return_statements(value))

        return returns

    def _contains_multiple_recursive_calls(self, expr: Any, proc_name: str) -> bool:
        """
        Verifica si una expresión contiene múltiples llamadas recursivas.

        Args:
            expr: Expresión a analizar
            proc_name: Nombre del procedimiento recursivo

        Returns:
            True si contiene más de una llamada recursiva
        """
        if not isinstance(expr, dict):
            return False

        # Contar llamadas recursivas en la expresión
        calls = []
        self._collect_recursive_calls(expr, proc_name, calls)

        return len(calls) > 1

    def _apply_iteration_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Iteración (Unrolling) a la recurrencia extraída.

        Cobertura V1:
        - Soportado: recurrencias lineales por desplazamiento unitario
          T(n) = T(n-1) + g(n)
        - No soportado explícito: formas divide-and-conquer o shifts no unitarios.

        Returns:
            {"success": bool, "iteration": dict, "reason": str}
        """
        if not self.recurrence:
            return {"success": False, "reason": "No hay recurrencia extraída"}
        self.proof_steps.append(
            {"id": "iteration_start", "text": "\\text{Aplicando Método de Iteración}"}
        )

        recurrence_form = str(self.recurrence.get("form") or "T(n)=T(n-1)+g(n)")
        recurrence_type = str(self.recurrence.get("type") or "")
        fallback_n0 = self.recurrence.get("n0")
        if not isinstance(fallback_n0, int):
            try:
                fallback_n0 = int(fallback_n0)
            except Exception:
                fallback_n0 = 0

        n_sym = Symbol("n", integer=True, nonnegative=True)
        i_sym = Symbol("i", integer=True, positive=True)

        def _format_n_power(exp: Expr) -> str:
            exp_simplified = simplify(exp)
            if exp_simplified == 0:
                return "1"
            if exp_simplified == 1:
                return "n"
            return f"n^{{{latex(exp_simplified)}}}"

        def _normalize_g(raw_g: Optional[str]) -> str:
            cleaned = str(raw_g or "").strip()
            lowered = cleaned.lower().replace(" ", "")
            if lowered in {"", "0", "\\theta(0)", "theta(0)"}:
                return "0"
            if lowered in {"\\theta(1)", "theta(1)"}:
                return "1"
            return cleaned

        def _parse_sympy_expr(raw_expr: str) -> Optional[Expr]:
            normalized = _normalize_g(raw_expr)
            lowered = normalized.lower().replace(" ", "")
            if lowered == "0":
                return Integer(0)
            if lowered == "1":
                return Integer(1)

            cleaned = normalized
            cleaned = cleaned.replace("\\cdot", "*")
            cleaned = cleaned.replace("\\left", "").replace("\\right", "")
            cleaned = cleaned.replace("^", "**")
            cleaned = cleaned.replace("\\sqrt", "sqrt")
            cleaned = re.sub(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", r"(\1)/(\2)", cleaned)
            cleaned = cleaned.replace("{", "(").replace("}", ")")
            cleaned = cleaned.replace("\\", "")
            try:
                return sympify(
                    cleaned,
                    locals={"n": n_sym, "sqrt": sqrt, "Rational": Rational},
                )
            except Exception:
                return None

        def _base_case_info() -> tuple[int, Optional[int], bool]:
            base_cases = {}
            if self.proc_def:
                try:
                    base_cases = self._detect_base_cases(self.proc_def)
                except Exception:
                    base_cases = {}

            selected_index: Optional[int] = None
            selected_value: Optional[int] = None
            for label, value in (base_cases or {}).items():
                match = re.search(r"T\(([-]?\d+)\)", str(label))
                if not match:
                    continue
                try:
                    idx = int(match.group(1))
                    val = int(value)
                except Exception:
                    continue
                if selected_index is None or idx < selected_index:
                    selected_index = idx
                    selected_value = val

            if selected_index is None:
                try:
                    selected_index = int(fallback_n0)
                except Exception:
                    selected_index = 0

            missing = selected_value is None
            return selected_index, selected_value, missing

        def _build_unsupported_result(
            support_code: str,
            g_n_value: str,
        ) -> Dict[str, Any]:
            base_idx, base_val, missing_base = _base_case_info()
            context = IterationStepContext(
                locale=self.locale,
                recurrence_form=recurrence_form,
                g_n=g_n_value,
                is_supported=False,
                support_code=support_code,
                base_case_index=base_idx,
                base_case_value=str(base_val) if base_val is not None else None,
                expansions=[],
                general_form=recurrence_form,
                k_condition=f"n-k={base_idx}",
                k_value="N/A",
                summation_expression="N/A",
                summation_evaluated="N/A",
                final_expression="T(n)=\\text{N/A}",
                dominant_term="\\text{N/A}",
                theta="N/A",
                summation_partial=True,
                asymptotic_partial=True,
                missing_base_case=missing_base,
            )
            step_bundle = build_iteration_step_bundle(context)
            iteration = {
                "method": "iteration",
                "g_function": g_n_value,
                "expansions": [],
                "general_form": recurrence_form,
                "base_case": {"condition": f"n-k={base_idx}", "k": "N/A"},
                "summation": {"expression": "N/A", "evaluated": "N/A"},
                "theta": "N/A",
                "step_by_step": step_bundle,
            }
            self.proof_steps.append(
                {
                    "id": "iteration_unsupported",
                    "text": (
                        "\\text{La cobertura actual del método de iteración no soporta esta forma de recurrencia.}"
                    ),
                }
            )
            return {"success": True, "iteration": iteration}

        if recurrence_type == "divide_conquer":
            if not self._is_single_branch_geometric_divide_conquer_recurrence(self.recurrence):
                return _build_unsupported_result(
                    support_code="ITER_UNSUPPORTED_NON_LINEAR_FORM",
                    g_n_value=str(self.recurrence.get("f", "1")),
                )

            base_idx, base_val, missing_base = _base_case_info()
            base_for_formula = base_idx if isinstance(base_idx, int) and base_idx > 0 else 1

            try:
                b_value = float(self.recurrence.get("b", 2))
            except Exception:
                b_value = 2.0
            b_display = self._simplify_number_latex(b_value if b_value > 1 else 2.0)

            g_n_value = _normalize_g(str(self.recurrence.get("f", "1")))
            if g_n_value == "0":
                theta = "\\Theta(1)"
                dominant_term = "1"
                summation_evaluated = "0"
                final_expression = f"T(n)=T({base_for_formula})"
            else:
                theta = "\\Theta(\\log n)"
                dominant_term = "\\log n"
                if base_for_formula == 1:
                    k_value = f"\\log_{{{b_display}}} n"
                else:
                    k_value = (
                        f"\\log_{{{b_display}}}\\left(\\frac{{n}}{{{base_for_formula}}}\\right)"
                    )
                summation_evaluated = (
                    f"\\sum_{{j=0}}^{{k-1}} {g_n_value}={g_n_value}\\cdot {k_value}"
                )
                final_expression = f"T(n)=T({base_for_formula})+{g_n_value}\\cdot {k_value}"

            k_condition = f"\\frac{{n}}{{{b_display}^k}}={base_for_formula}"
            if base_for_formula == 1:
                k_value = f"\\log_{{{b_display}}} n"
            else:
                k_value = f"\\log_{{{b_display}}}\\left(\\frac{{n}}{{{base_for_formula}}}\\right)"

            expansions = [
                f"T(n)=T\\left(\\frac{{n}}{{{b_display}}}\\right)+{g_n_value}",
                f"T(n)=T\\left(\\frac{{n}}{{{b_display}^2}}\\right)+2\\cdot {g_n_value}",
                f"T(n)=T\\left(\\frac{{n}}{{{b_display}^3}}\\right)+3\\cdot {g_n_value}",
            ]
            general_form = f"T(n)=T\\left(\\frac{{n}}{{{b_display}^k}}\\right)+k\\cdot {g_n_value}"
            summation_expression = f"T(n)=T({base_for_formula})+\\sum_{{j=0}}^{{k-1}} {g_n_value}"

            context = IterationStepContext(
                locale=self.locale,
                recurrence_form=recurrence_form,
                g_n=g_n_value,
                is_supported=True,
                support_code=None,
                base_case_index=base_for_formula,
                base_case_value=str(base_val) if base_val is not None else None,
                expansions=expansions,
                general_form=general_form,
                k_condition=k_condition,
                k_value=k_value,
                summation_expression=summation_expression,
                summation_evaluated=summation_evaluated,
                final_expression=final_expression,
                dominant_term=dominant_term,
                theta=theta,
                summation_partial=False,
                asymptotic_partial=False,
                missing_base_case=missing_base,
            )
            step_bundle = build_iteration_step_bundle(context)

            iteration = {
                "method": "iteration",
                "g_function": g_n_value,
                "expansions": expansions,
                "general_form": general_form,
                "base_case": {
                    "condition": k_condition,
                    "k": k_value,
                },
                "summation": {
                    "expression": summation_expression,
                    "evaluated": summation_evaluated,
                },
                "theta": theta,
                "step_by_step": step_bundle,
            }
            self.proof_steps.append(
                {
                    "id": "iteration_result",
                    "text": f"\\text{{Resultado por iteración geométrica: }} T(n) = {theta}",
                }
            )
            return {"success": True, "iteration": iteration}

        if recurrence_type != "linear_shift":
            return _build_unsupported_result(
                support_code="ITER_UNSUPPORTED_NON_LINEAR_FORM",
                g_n_value="0",
            )

        order_raw = self.recurrence.get("order", 1)
        try:
            order = int(order_raw)
        except Exception:
            order = 1
        shifts = self.recurrence.get("shifts", [1]) or [1]
        if not isinstance(shifts, list):
            shifts = [1]
        shifts_as_int: List[int] = []
        for shift in shifts:
            try:
                shifts_as_int.append(int(shift))
            except Exception:
                continue
        if not shifts_as_int:
            shifts_as_int = [1]

        coefficients = self.recurrence.get("coefficients", [1]) or [1]
        coeff_by_shift: Dict[int, int] = {}
        if isinstance(coefficients, list):
            for idx, shift in enumerate(sorted(shifts_as_int)):
                if idx >= len(coefficients):
                    continue
                try:
                    coeff_by_shift[int(shift)] = int(coefficients[idx])
                except Exception:
                    continue
        elif isinstance(coefficients, dict):
            for key, value in coefficients.items():
                try:
                    coeff_by_shift[int(key)] = int(value)
                except Exception:
                    continue
        if 1 not in coeff_by_shift:
            coeff_by_shift[1] = 1

        g_n_raw = self.recurrence.get("g(n)")
        if g_n_raw is None and self.proc_def:
            try:
                linear_info = self._detect_linear_recurrence(
                    self.proc_def,
                    self._find_recursive_calls(self.proc_def),
                )
                if linear_info and linear_info.get("g_n") is not None:
                    g_n_raw = linear_info.get("g_n")
            except Exception:
                g_n_raw = None
        g_n_value = _normalize_g(str(g_n_raw or "0"))

        is_first_order_unit_decrement = order == 1 and sorted(shifts_as_int) == [1]
        coeff_n_minus_1 = coeff_by_shift.get(1, 1)
        if not is_first_order_unit_decrement:
            return _build_unsupported_result(
                support_code="ITER_UNSUPPORTED_NON_UNIT_SHIFT",
                g_n_value=g_n_value,
            )
        if coeff_n_minus_1 <= 0:
            return _build_unsupported_result(
                support_code="ITER_UNSUPPORTED_NON_LINEAR_FORM",
                g_n_value=g_n_value,
            )

        # Soporte explícito para T(n)=c*T(n-1)+g(n), c>1 (ej: Hanoi: c=2, g(n)=1).
        if coeff_n_minus_1 > 1:
            base_idx, base_val, missing_base = _base_case_info()
            c_val = int(coeff_n_minus_1)
            c_latex = self._simplify_number_latex(c_val)
            g_expr_n = _parse_sympy_expr(g_n_value)

            g_n_latex = latex(simplify(g_expr_n)) if g_expr_n is not None else g_n_value
            g_n_minus_1_latex = (
                latex(simplify(g_expr_n.subs(n_sym, n_sym - 1)))
                if g_expr_n is not None
                else f"({g_n_value})|_{{n-1}}"
            )
            g_n_minus_2_latex = (
                latex(simplify(g_expr_n.subs(n_sym, n_sym - 2)))
                if g_expr_n is not None
                else f"({g_n_value})|_{{n-2}}"
            )

            expansions = [
                f"T(n)={c_latex}T(n-1)+{g_n_latex}",
                f"T(n)={c_latex}^2T(n-2)+{c_latex}\\cdot {g_n_minus_1_latex}+{g_n_latex}",
                f"T(n)={c_latex}^3T(n-3)+{c_latex}^2\\cdot {g_n_minus_2_latex}+{c_latex}\\cdot {g_n_minus_1_latex}+{g_n_latex}",
            ]
            general_form = rf"T(n)={c_latex}^kT(n-k)+\sum_{{j=0}}^{{k-1}} {c_latex}^j g(n-j)"
            k_condition = f"n-k={base_idx}"
            k_value = "n" if base_idx == 0 else f"n-{base_idx}"

            lower_limit = base_idx + 1
            summation_expression = rf"T(n)={c_latex}^{{{k_value}}}T({base_idx})+\sum_{{i={lower_limit}}}^{{n}} {c_latex}^{{n-i}}\,g(i)"

            summation_evaluated = rf"\sum_{{i={lower_limit}}}^{{n}} {c_latex}^{{n-i}}\,g(i)"
            sum_partial = True
            asymptotic_partial = True
            if g_expr_n is not None and g_expr_n.is_number:
                g_const = simplify(g_expr_n)
                summation_evaluated = (
                    rf"\sum_{{j=0}}^{{{k_value}-1}} {c_latex}^j \cdot {latex(g_const)}"
                    rf"={latex(g_const)}\cdot\frac{{{c_latex}^{{{k_value}}}-1}}{{{c_latex}-1}}"
                )
                sum_partial = False
                asymptotic_partial = False

            if base_val is not None:
                final_expression = rf"T(n)={c_latex}^{{{k_value}}}\cdot {base_val}+{summation_evaluated.split('=')[-1]}"
            else:
                final_expression = rf"T(n)={c_latex}^{{{k_value}}}T({base_idx})+{summation_evaluated.split('=')[-1]}"

            dominant_term = rf"{c_latex}^{{{k_value}}}"
            theta = rf"\Theta({c_latex}^n)"

            context = IterationStepContext(
                locale=self.locale,
                recurrence_form=recurrence_form,
                g_n=g_n_value,
                is_supported=True,
                support_code=None,
                base_case_index=base_idx,
                base_case_value=str(base_val) if base_val is not None else None,
                expansions=expansions,
                general_form=general_form,
                k_condition=k_condition,
                k_value=k_value,
                summation_expression=summation_expression,
                summation_evaluated=summation_evaluated,
                final_expression=final_expression,
                dominant_term=dominant_term,
                theta=theta,
                summation_partial=sum_partial,
                asymptotic_partial=asymptotic_partial,
                missing_base_case=missing_base,
            )
            step_bundle = build_iteration_step_bundle(context)
            iteration = {
                "method": "iteration",
                "g_function": g_n_value,
                "expansions": expansions,
                "general_form": general_form,
                "base_case": {"condition": k_condition, "k": k_value},
                "summation": {
                    "expression": summation_expression,
                    "evaluated": summation_evaluated,
                },
                "theta": theta,
                "step_by_step": step_bundle,
            }
            self.proof_steps.append(
                {
                    "id": "iteration_result",
                    "text": f"\\text{{Resultado por iteración: }} T(n) = {theta}",
                }
            )
            return {"success": True, "iteration": iteration}

        base_idx, base_val, missing_base = _base_case_info()
        g_expr_n = _parse_sympy_expr(g_n_value)

        if g_expr_n is not None:
            g_n_latex = latex(simplify(g_expr_n))
            g_n_minus_1_latex = latex(simplify(g_expr_n.subs(n_sym, n_sym - 1)))
            g_n_minus_2_latex = latex(simplify(g_expr_n.subs(n_sym, n_sym - 2)))
            g_i_expr = simplify(g_expr_n.subs(n_sym, i_sym))
            g_i_latex = latex(g_i_expr)
        else:
            g_n_latex = g_n_value
            g_n_minus_1_latex = f"({g_n_value})|_{{n-1}}"
            g_n_minus_2_latex = f"({g_n_value})|_{{n-2}}"
            g_i_latex = re.sub(r"\bn\b", "i", g_n_value)
            if g_i_latex == g_n_value:
                g_i_latex = "g(i)"

        expansions = [
            f"T(n)=T(n-1)+{g_n_latex}",
            f"T(n)=T(n-2)+{g_n_minus_1_latex}+{g_n_latex}",
            f"T(n)=T(n-3)+{g_n_minus_2_latex}+{g_n_minus_1_latex}+{g_n_latex}",
        ]
        general_form = r"T(n)=T(n-k)+\sum_{j=0}^{k-1} g(n-j)"

        lower_limit = base_idx + 1
        k_condition = f"n-k={base_idx}"
        k_value = "n" if base_idx == 0 else f"n-{base_idx}"
        summation_expression = f"T(n)=T({base_idx})+\\sum_{{i={lower_limit}}}^{{n}} {g_i_latex}"

        summation_evaluated = f"\\sum_{{i={lower_limit}}}^{{n}} {g_i_latex}"
        sum_partial = True
        sum_expr = None
        if g_expr_n is not None:
            try:
                sum_expr = summation(g_i_expr, (i_sym, Integer(lower_limit), n_sym))
                sum_expr = simplify(sum_expr)
                sum_partial = bool(sum_expr.has(SymSum))
                summation_evaluated = (
                    f"\\sum_{{i={lower_limit}}}^{{n}} {g_i_latex}={latex(sum_expr)}"
                )
            except Exception:
                sum_expr = None
                sum_partial = True

        if base_val is not None and sum_expr is not None:
            try:
                final_expr_obj = simplify(Integer(base_val) + sum_expr)
                final_expression = f"T(n)={latex(final_expr_obj)}"
            except Exception:
                final_expression = f"T(n)={base_val}+{summation_evaluated.split('=')[-1]}"
        elif base_val is not None:
            final_expression = f"T(n)={base_val}+{summation_evaluated.split('=')[-1]}"
        else:
            final_expression = f"T(n)=T({base_idx})+{summation_evaluated.split('=')[-1]}"

        theta_core: Optional[str] = None
        dominant_term = "\\text{N/A}"
        asymptotic_partial = False

        growth_expr = sum_expr if sum_expr is not None else None
        if growth_expr is not None and not sum_partial:
            try:
                if growth_expr.is_polynomial(n_sym):
                    degree = int(Poly(expand(growth_expr), n_sym).degree())
                    theta_core = _format_n_power(Integer(max(degree, 0)))
                    dominant_term = theta_core
                else:
                    lead = simplify(expand(growth_expr).as_leading_term(n_sym))
                    _, exp = lead.as_coeff_exponent(n_sym)
                    if exp.is_number:
                        theta_core = _format_n_power(exp)
                        dominant_term = theta_core
            except Exception:
                theta_core = None

        if theta_core is None and g_expr_n is not None:
            try:
                if g_expr_n.is_number:
                    theta_core = "n"
                    dominant_term = "n"
                    asymptotic_partial = sum_partial
                elif g_expr_n.is_polynomial(n_sym):
                    g_degree = int(Poly(expand(g_expr_n), n_sym).degree())
                    theta_core = _format_n_power(Integer(max(g_degree, 0) + 1))
                    dominant_term = theta_core
                    asymptotic_partial = True
                elif (
                    isinstance(g_expr_n, Pow) and g_expr_n.base == n_sym and g_expr_n.exp.is_number
                ):
                    next_exp = simplify(g_expr_n.exp + 1)
                    theta_core = _format_n_power(next_exp)
                    dominant_term = theta_core
                    asymptotic_partial = True
                elif simplify(g_expr_n - sqrt(n_sym)) == 0:
                    theta_core = r"n^{\frac{3}{2}}"
                    dominant_term = theta_core
                    asymptotic_partial = True
            except Exception:
                theta_core = None

        if theta_core is None:
            theta = "N/A"
            if dominant_term == "\\text{N/A}":
                dominant_term = summation_evaluated.split("=")[-1]
            asymptotic_partial = True
        else:
            theta = f"\\Theta({theta_core})"
            asymptotic_partial = asymptotic_partial or sum_partial

        context = IterationStepContext(
            locale=self.locale,
            recurrence_form=recurrence_form,
            g_n=g_n_value,
            is_supported=True,
            support_code=None,
            base_case_index=base_idx,
            base_case_value=str(base_val) if base_val is not None else None,
            expansions=expansions,
            general_form=general_form,
            k_condition=k_condition,
            k_value=k_value,
            summation_expression=summation_expression,
            summation_evaluated=summation_evaluated,
            final_expression=final_expression,
            dominant_term=dominant_term,
            theta=theta,
            summation_partial=sum_partial,
            asymptotic_partial=asymptotic_partial,
            missing_base_case=missing_base,
        )
        step_bundle = build_iteration_step_bundle(context)

        iteration = {
            "method": "iteration",
            "g_function": g_n_value,
            "expansions": expansions,
            "general_form": general_form,
            "base_case": {
                "condition": k_condition,
                "k": k_value,
            },
            "summation": {
                "expression": summation_expression,
                "evaluated": summation_evaluated,
            },
            "theta": theta,
            "step_by_step": step_bundle,
        }

        self.proof_steps.append(
            {
                "id": "iteration_result",
                "text": f"\\text{{Resultado por iteración: }} T(n) = {theta}",
            }
        )

        return {"success": True, "iteration": iteration}

    def _extract_g_function(self) -> Optional[Dict[str, Any]]:
        """
        Extrae la función g(n) de la recurrencia almacenada.

        Para casos con múltiples términos recursivos (ej: T(n) = T(n-1) + T(n-2)),
        detecta correctamente todos los términos.

        Returns:
            {"type": str, "pattern": str, "factor": float, "has_multiple_terms": bool, "all_factors": list} o None
        """
        # Analizar la forma de la recurrencia para extraer g(n)
        form = self.recurrence.get("form", "")

        # Recurrencia tipo MOD (Euclides): T(n) = T(mod) + O(1) → Θ(log n)
        if self.recurrence.get("subproblem_type") == "mod" or "T(mod)" in form:
            return {
                "type": "mod",
                "pattern": "mod",
                "factor": 1,
                "has_multiple_terms": False,
            }

        # Buscar patrón T(n-k), T(n/k), etc.
        import re

        # Patrón para n-k (puede haber múltiples)
        # findall con un grupo devuelve solo el grupo capturado (el número)
        matches = re.findall(r"T\(n-(\d+)\)", form)
        if matches:
            # Extraer todos los factores
            factors = [int(m) for m in matches]
            # Si hay múltiples factores distintos, es un caso especial (ej: Fibonacci)
            unique_factors = sorted(set(factors))
            has_multiple = len(unique_factors) > 1

            # Usar el factor más pequeño como patrón principal
            k = min(factors) if factors else 1

            return {
                "type": "subtraction",
                "pattern": f"n-{k}",
                "factor": k,
                "has_multiple_terms": has_multiple,
                "all_factors": unique_factors if has_multiple else None,
            }

        # Patrón para n/k
        matches = re.findall(r"T\(n/(\d+)\)", form)
        if matches:
            factors = [int(m) for m in matches]
            unique_factors = sorted(set(factors))
            has_multiple = len(unique_factors) > 1
            k = factors[0]  # Usar el primero
            return {
                "type": "division",
                "pattern": f"n/{k}",
                "factor": k,
                "has_multiple_terms": has_multiple,
                "all_factors": unique_factors if has_multiple else None,
            }

        # Por defecto, asumir n-1
        return {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1,
            "has_multiple_terms": False,
        }

    def _expand_recurrence(
        self, g_n_info: Dict[str, Any], f_n: str, num_expansions: int = 3
    ) -> List[str]:
        """
        Genera expansiones simbólicas de la recurrencia usando sympy para simplificar.

        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            num_expansions: Número de expansiones a generar

        Returns:
            Lista de strings LaTeX con las expansiones simplificadas
        """
        g_type = g_n_info["type"]
        g_n_info["pattern"]
        factor = g_n_info["factor"]

        expansions = []
        Symbol("n")

        # Simplificar f(n) usando sympy si es posible
        try:
            # Intentar parsear f_n como expresión sympy
            if f_n.strip() in ["1", "c", "C"]:
                f_n_expr = Integer(1)
            elif f_n.strip().isdigit():
                f_n_expr = Integer(int(f_n.strip()))
            else:
                # Intentar parsear como expresión
                f_n_expr = sympify(
                    f_n.replace("\\", "")
                    .replace("theta", "")
                    .replace("Theta", "")
                    .replace("(", "")
                    .replace(")", "")
                    .strip(),
                    evaluate=False,
                )
        except Exception:
            # Si falla, usar como string
            f_n_expr = None

        if g_type == "subtraction":
            # T(n) = T(n-1) + f(n)
            # T(n) = T(n-2) + f(n-1) + f(n)
            # T(n) = T(n-3) + f(n-2) + f(n-1) + f(n)
            for i in range(1, num_expansions + 1):
                terms = []
                # Agregar T(n-i)
                terms.append(f"T(n-{i})")
                # Agregar suma de f(n-j) para j = 0..i-1
                f_terms = []
                for j in range(i):
                    if j == 0:
                        if f_n_expr is not None and isinstance(f_n_expr, Integer):
                            # Si f(n) es constante, simplificar
                            f_terms.append(f"{f_n_expr}")
                        else:
                            f_terms.append(f"({f_n})")
                    else:
                        f_terms.append(f"({f_n}|_{{n-{j}}})")

                # Si f(n) es constante, simplificar la suma usando sympy
                if f_n_expr is not None and isinstance(f_n_expr, Integer):
                    # Suma de i términos constantes = i * constante
                    sum_value = i * f_n_expr
                    # Simplificar usando sympy
                    sum_simplified = simplify(sum_value)
                    sum_latex = latex(sum_simplified)
                    expansion = f"T(n) = T(n-{i}) + {sum_latex}"
                else:
                    # Si hay múltiples términos iguales, intentar agrupar
                    if len(f_terms) > 1 and all(term == f_terms[0] for term in f_terms):
                        # Todos los términos son iguales
                        expansion = f"T(n) = T(n-{i}) + {len(f_terms)} \\cdot {f_terms[0]}"
                    else:
                        expansion = f"T(n) = T(n-{i}) + {' + '.join(f_terms)}"
                expansions.append(expansion)

        elif g_type == "division":
            # T(n) = T(n/2) + f(n)
            # T(n) = T(n/4) + f(n/2) + f(n)
            for i in range(1, num_expansions + 1):
                denominator = factor**i
                terms = []
                terms.append(f"T(n/{denominator})")
                # Agregar suma de f(n/2^j) para j = 0..i-1
                f_terms = []
                for j in range(i):
                    if j == 0:
                        if f_n_expr is not None and isinstance(f_n_expr, Integer):
                            f_terms.append(f"{f_n_expr}")
                        else:
                            f_terms.append(f"({f_n})")
                    else:
                        denom_j = factor**j
                        f_terms.append(f"({f_n}|_{{n/{denom_j}}})")
                terms.append(" + ".join(f_terms))

                expansion = f"T(n) = {' + '.join(terms)}"
                expansions.append(expansion)

        return expansions

    def _create_general_form(self, g_n_info: Dict[str, Any], f_n: str) -> str:
        """
        Crea la forma general T(n) = T(g^k(n)) + Σ f(g^i(n)).

        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)

        Returns:
            String LaTeX con la forma general
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]

        if g_type == "subtraction":
            return f"T(n) = T(n-k) + \\sum_{{i=0}}^{{k-1}} ({f_n})|_{{n-i}}"
        elif g_type == "division":
            return f"T(n) = T(n/{factor}^k) + \\sum_{{i=0}}^{{k-1}} ({f_n})|_{{n/{factor}^i}}"
        else:
            return "T(n) = T(g^k(n)) + \\sum_{i=0}^{k-1} f(g^i(n))"

    def _determine_k_from_base_case(self, g_n_info: Dict[str, Any], n0: int) -> str:
        """
        Determina el valor de k cuando se alcanza el caso base.

        Args:
            g_n_info: Información de la función g(n)
            n0: Tamaño del caso base

        Returns:
            Expresión LaTeX para k
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]

        if g_type == "subtraction":
            # n - k = n0 => k = n - n0
            if n0 == 1:
                return "n-1"
            else:
                return f"n-{n0}"
        elif g_type == "division":
            # n / c^k = n0 => k = log_c(n/n0)
            if n0 == 1:
                return f"\\log_{{{factor}}}(n)"
            else:
                return f"\\log_{{{factor}}}(n/{n0})"
        else:
            return "k"

    def _substitute_k_in_summation(
        self, g_n_info: Dict[str, Any], f_n: str, k_expr: str, n0: int
    ) -> str:
        """
        Sustituye k en la sumatoria.

        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            k_expr: Expresión para k
            n0: Tamaño del caso base

        Returns:
            String LaTeX con la sustitución
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]

        if g_type == "subtraction":
            return f"T(n) = T({n0}) + \\sum_{{i=0}}^{{{k_expr}}} ({f_n})|_{{n-i}}"
        elif g_type == "division":
            return f"T(n) = T({n0}) + \\sum_{{i=0}}^{{{k_expr}}} ({f_n})|_{{n/{factor}^i}}"
        else:
            return f"T(n) = T({n0}) + \\sum f(\\cdot)"

    def _solve_summation(self, g_n_info: Dict[str, Any], f_n: str, k_expr: str) -> Dict[str, str]:
        """
        Evalúa la sumatoria y simplifica a notación asintótica.

        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            k_expr: Expresión para k

        Returns:
            {"evaluated": str, "theta": str}
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]

        # Simplificar f(n) para análisis usando sympy
        f_simplified = f_n.strip().lower()

        # Intentar parsear f(n) como expresión sympy
        try:
            if f_simplified in ["1", "c", "C"]:
                f_n_expr = Integer(1)
            elif f_simplified.isdigit():
                f_n_expr = Integer(int(f_simplified))
            else:
                f_n_expr = None
        except Exception:
            f_n_expr = None

        # Detectar el tipo de sumatoria
        if (
            f_simplified == "1"
            or f_simplified == "c"
            or (f_n_expr is not None and isinstance(f_n_expr, Integer) and f_n_expr == 1)
        ):
            # Sumatoria constante: Σ c = c * k
            if g_type == "subtraction":
                # Para k = n-1, la suma va de i=0 a i=n-1, que son n términos (0, 1, 2, ..., n-1)
                # Suma de n términos de 1 = n * 1 = n
                # Usar sympy para simplificar
                n_sym = Symbol("n")
                # La suma de i=0 a n-1 de 1 es n (n términos)
                sum_expr = n_sym * 1  # n términos de 1
                sum_simplified = simplify(sum_expr)
                sum_latex = latex(sum_simplified)
                evaluated = f"\\sum_{{i=0}}^{{n-1}} 1 = {sum_latex} = \\Theta(n)"
                theta = "n"
            else:  # division
                evaluated = "\\Theta(\\log n)"
                theta = "\\log n"

        elif f_simplified == "n" or "n" in f_simplified:
            # Sumatoria aritmética o geométrica
            if g_type == "subtraction":
                # Σ (n-i) para i=0..n-1 = n + (n-1) + ... + 1 = n(n+1)/2
                evaluated = "\\sum_{i=0}^{n-1} (n-i) = \\frac{n(n+1)}{2}"
                theta = "n^2"
            else:  # division
                # Σ n/2^i para i=0..log(n) ≈ 2n (serie geométrica)
                evaluated = f"\\sum_{{i=0}}^{{\\log n}} n/{factor}^i \\approx 2n"
                theta = "n"

        elif "^" in f_simplified or "2" in f_simplified:
            # Polinomio de grado superior
            if g_type == "subtraction":
                evaluated = "\\Theta(n^3)"
                theta = "n^3"
            else:
                evaluated = "\\Theta(n^2)"
                theta = "n^2"

        else:
            # Por defecto
            if g_type == "subtraction":
                evaluated = "\\Theta(n)"
                theta = "n"
            else:
                evaluated = "\\Theta(n)"
                theta = "n"

        return {"evaluated": evaluated, "theta": theta}

    # ============================================================================
    # MÉTODO DE ÁRBOL DE RECURSIÓN
    # ============================================================================

    def _detect_recursion_tree_method(
        self,
        proc_def: Dict[str, Any],
        recursive_calls: List[Dict[str, Any]],
        a: int,
        b: float,
    ) -> bool:
        """
        Detecta si debe usarse el Método de Árbol de Recursión.

        Reglas para usar Método de Árbol de Recursión:
        1. a ≥ 1: Hay al menos una llamada recursiva con reducción bien definida
        2. Subproblemas uniformes: Todos tienen el mismo tamaño (mismo b)
        3. Divide-and-conquer: Estructura de dividir y combinar
        4. NO es recurrencia lineal por desplazamiento: evitar patrones n-1, n-k
        5. Reducción uniforme: Todas las llamadas reciben el mismo g(n)
        6. Combina resultados: El algoritmo suma/combina costos de subproblemas
        7. Útil para visualización: Aunque se pueda usar Teorema Maestro, el árbol aporta intuición

        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            a: Número de subproblemas
            b: Factor de reducción

        Returns:
            True si debe usar Método de Árbol de Recursión
        """
        # Regla 1: al menos una llamada recursiva.
        if a < 1:
            return False

        # Regla 2: Verificar que todos los subproblemas tienen el mismo tamaño
        # Esto ya se verificó en _extract_recurrence, pero confirmamos aquí
        subproblem_sizes = []
        for call in recursive_calls:
            size_info = self._analyze_subproblem_size(call, proc_def)
            if size_info and size_info.get("b"):
                subproblem_sizes.append(size_info["b"])

        if not subproblem_sizes or len(set(subproblem_sizes)) > 1:
            return False

        # Regla 3: Verificar que es divide-and-conquer (no decrease-and-conquer)
        # Si hay subtracción (n-1, n-k), no es divide-and-conquer
        has_subtraction = any(
            self._analyze_subproblem_type(call, proc_def)
            and self._analyze_subproblem_type(call, proc_def).get("type") == "subtraction"
            for call in recursive_calls
        )
        if has_subtraction:
            return False

        # Regla 5: Verificar reducción uniforme (todas las llamadas usan n/b)
        # Esto ya está garantizado si b es constante

        # Regla 6: Verificar que combina resultados (puede ser suma, max, min, etc.)
        # Por defecto, si a ≥ 2 y es divide-and-conquer, asumimos que combina
        # (esto se puede refinar más adelante)

        # Regla 7: Es útil para visualización cuando a ≥ 2
        return True

    def _apply_recursion_tree_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Árbol de Recursión a la recurrencia extraída.

        Implementa los 7 pasos del método:
        1. Extraer T(n) = a·T(n/b) + f(n)
        2. Construir nivel 0 (raíz)
        3. Construir nivel i (generalización)
        4. Calcular altura h = log_b(n)
        5. Sumar costos por nivel
        6. Identificar nivel dominante
        7. Derivar Θ final

        Returns:
            {"success": bool, "recursion_tree": dict, "reason": str}
        """
        if not self.recurrence:
            return {"success": False, "reason": "No hay recurrencia extraída"}

        def _with_tree_steps(
            recursion_tree_payload: Dict[str, Any],
            *,
            support_code: Optional[str] = None,
            summation_partial: bool = False,
            tree_inconsistent: bool = False,
            asymptotic_partial: bool = False,
        ) -> Dict[str, Any]:
            recurrence_form = str(self.recurrence.get("form", "T(n)=aT(n/b)+f(n)"))
            recurrence_type = str(self.recurrence.get("type", ""))
            raw_a = self.recurrence.get("a")
            raw_b = self.recurrence.get("b")
            raw_n0 = self.recurrence.get("n0", 1)
            f_n = str(self.recurrence.get("f", self.recurrence.get("g(n)", "0"))).strip() or "0"

            a_value: Optional[int]
            b_value: Optional[float]
            n0_value: Optional[int]
            try:
                a_value = int(raw_a) if raw_a is not None else None
            except Exception:
                a_value = None
            try:
                b_value = float(raw_b) if raw_b is not None else None
            except Exception:
                b_value = None
            try:
                n0_value = int(raw_n0) if raw_n0 is not None else 1
            except Exception:
                n0_value = 1

            if support_code is None:
                if recurrence_type != "divide_conquer":
                    support_code = "RT_UNSUPPORTED_FORM"
                elif a_value is None or b_value is None or a_value < 1 or b_value <= 1:
                    support_code = "RT_INVALID_PARAMETERS"

            is_supported = support_code is None
            b_display = (
                self._simplify_number_latex(b_value)
                if isinstance(b_value, (float, int)) and b_value > 0
                else "b"
            )
            a_display = str(a_value) if a_value is not None else "a"
            n0_display = n0_value if n0_value is not None else 1

            summation_data = recursion_tree_payload.get("summation", {})
            total_expression = summation_data.get("expression")
            simplified_expression = summation_data.get("evaluated") or total_expression
            dominant_data = recursion_tree_payload.get("dominating_level", {}) or {}
            dominant_reason = dominant_data.get("reason")
            dominant_level = dominant_data.get("level")
            theta_raw = recursion_tree_payload.get("theta")
            theta_latex = None
            if isinstance(theta_raw, str) and theta_raw.strip():
                theta_latex = theta_raw if "T(n)" in theta_raw else f"T(n) = {theta_raw}"

            if isinstance(dominant_level, str) and dominant_level.lower() == "unknown":
                tree_inconsistent = True
                asymptotic_partial = True

            level_model = f"N_i={a_display}^i,\\;n_i=\\frac{{n}}{{{b_display}^i}},\\;c_i=f\\left(\\frac{{n}}{{{b_display}^i}}\\right)"
            level_cost = f"C_i={a_display}^i\\cdot f\\left(\\frac{{n}}{{{b_display}^i}}\\right)"
            height_latex = (
                recursion_tree_payload.get("height")
                or f"\\frac{{n}}{{{b_display}^h}}={n0_display}\\Rightarrow h=\\log_{{{b_display}}}\\left(\\frac{{n}}{{{n0_display}}}\\right)"
            )
            leaf_count = f"L={a_display}^h=n^{{\\log_{{{b_display}}} {a_display}}}"
            leaf_cost = f"C_{{\\text{{hojas}}}}=L\\cdot T({n0_display})"

            step_ctx = RecursionTreeStepContext(
                locale=self.locale,
                recurrence_form=recurrence_form,
                recurrence_type=recurrence_type,
                a=a_value,
                b=b_value,
                f_n=f_n,
                n0=n0_value,
                is_supported=is_supported,
                support_code=support_code,
                level_model_latex=level_model if is_supported else None,
                level_cost_latex=level_cost if is_supported else None,
                height_latex=height_latex if is_supported else None,
                leaf_count_latex=leaf_count if is_supported else None,
                leaf_cost_latex=leaf_cost if is_supported else None,
                total_expression_latex=total_expression if is_supported else None,
                simplified_expression_latex=(simplified_expression if is_supported else None),
                dominant_level=(str(dominant_level) if dominant_level is not None else None),
                dominant_reason_latex=dominant_reason if is_supported else None,
                theta_latex=theta_latex if is_supported else None,
                summation_partial=summation_partial,
                tree_inconsistent=tree_inconsistent,
                asymptotic_partial=asymptotic_partial,
            )
            recursion_tree_payload["step_by_step"] = build_recursion_tree_step_bundle(step_ctx)
            return recursion_tree_payload

        self.proof_steps.append(
            {
                "id": "tree_start",
                "text": "\\text{Aplicando Método de Árbol de Recursión}",
            }
        )

        # Caso especial: linear_shift (QuickSort T(n)=T(n-1)+n → n², o recursión en FOR → 2^n)
        recurrence_type = self.recurrence.get("type", "divide_conquer")
        if recurrence_type == "linear_shift":
            g_n = self.recurrence.get("g(n)", "0")
            n0 = self.recurrence.get("n0", 1)
            # Prioridad: branching subset (generación de subconjuntos) → 2^n antes que QuickSort → n²
            if self.recurrence.get("branching_subset"):
                recurrence_form = self.recurrence.get("form", "T(n) = T(n-1) + \\Theta(1)")
                self.proof_steps.append(
                    {
                        "id": "tree_extract",
                        "text": f"\\text{{Recurrencia identificada }} {recurrence_form}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step1_note",
                        "text": "\\text{Nota: Recursión dentro de FOR (generación de subconjuntos). En cada nivel hay múltiples ramas; el árbol tiene } O(2^n) \\text{ nodos.}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step2",
                        "text": "\\text{Paso 2: Análisis del árbol de recursión} \\\\ \\text{En cada llamada el FOR genera varias ramas recursivas}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step3",
                        "text": "\\text{Paso 3: Número de nodos} \\\\ \\text{En el nivel } i \\text{, hay en el orden de } 2^i \\text{ nodos}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step4",
                        "text": "\\text{Paso 4: Altura del árbol} \\\\ \\text{La altura es } \\Theta(n)",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step5",
                        "text": "\\text{Paso 5: Costo total} \\\\ \\sum_{i=0}^{n} 2^i = 2^{n+1} - 1 = \\Theta(2^n)",
                    }
                )
                theta = "2^n"
                recursion_tree = {
                    "method": "recursion_tree",
                    "recurrence_type": "linear_shift",
                    "levels": [
                        {
                            "level": 0,
                            "num_nodes_latex": "1",
                            "subproblem_size_latex": "n",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "1",
                        },
                        {
                            "level": 1,
                            "num_nodes_latex": "n",
                            "subproblem_size_latex": "n-1",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "n",
                        },
                    ],
                    "height": "n",
                    "summation": {
                        "expression": "\\sum_{i=0}^{n} 2^i = 2^{n+1} - 1",
                        "theta": theta,
                    },
                    "dominating_level": {
                        "reason": "\\text{Ramificación: número de nodos } \\Theta(2^n)"
                    },
                    "table_by_levels": [],
                    "theta": f"\\Theta({theta})",
                }
                self.proof_steps.append({"id": "tree_result", "text": f"T(n) = \\Theta({theta})"})
                recursion_tree = _with_tree_steps(
                    recursion_tree,
                    support_code="RT_UNSUPPORTED_FORM",
                    asymptotic_partial=True,
                )
                return {"success": True, "recursion_tree": recursion_tree}
            if g_n and g_n.strip().lower() == "n":
                # Árbol lineal: nivel i tiene 1 nodo con costo (n-i), total = n+(n-1)+...+1 = n(n+1)/2 = Θ(n²)
                self.proof_steps.append(
                    {
                        "id": "tree_extract",
                        "text": "T(n) = T(n-1) + n \\quad \\text{(árbol lineal: 1 hijo por nivel)}",
                    }
                )
                theta = "n^2"
                recursion_tree = {
                    "method": "recursion_tree",
                    "recurrence_type": "linear_shift",
                    "levels": [
                        {
                            "level": 0,
                            "num_nodes_latex": "1",
                            "subproblem_size_latex": "n",
                            "cost_per_node_latex": "n",
                            "total_cost_latex": "n",
                        },
                        {
                            "level": 1,
                            "num_nodes_latex": "1",
                            "subproblem_size_latex": "n-1",
                            "cost_per_node_latex": "n-1",
                            "total_cost_latex": "n-1",
                        },
                    ],
                    "height": "n",
                    "summation": {
                        "expression": "\\sum_{i=0}^{n-1} (n-i) = \\frac{n(n+1)}{2}",
                        "theta": theta,
                    },
                    "dominating_level": {
                        "reason": "\\text{Suma aritmética } n + (n-1) + \\ldots + 1 = \\Theta(n^2)"
                    },
                    "table_by_levels": [],
                    "theta": f"\\Theta({theta})",
                }
                self.proof_steps.append({"id": "tree_result", "text": f"T(n) = \\Theta({theta})"})
                recursion_tree = _with_tree_steps(
                    recursion_tree,
                    support_code="RT_UNSUPPORTED_FORM",
                    asymptotic_partial=True,
                )
                return {"success": True, "recursion_tree": recursion_tree}

            # Fibonacci-type: T(n) = c1*T(n-k1) + c2*T(n-k2) + ... (múltiples términos)
            # Árbol con subproblemas superpuestos; no usar estructura divide-and-conquer
            shifts = self.recurrence.get("shifts", [])
            self.recurrence.get("coefficients", [])
            if len(shifts) >= 2:
                recurrence_form = self.recurrence.get("form", "T(n) = T(n-1) + T(n-2) + 1")
                self.proof_steps.append(
                    {
                        "id": "tree_extract",
                        "text": f"\\text{{Recurrencia }} {recurrence_form}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step1_note",
                        "text": "\\text{Árbol con subproblemas superpuestos: el mismo T(k) se calcula varias veces. Crecimiento exponencial } \\Theta(\\varphi^n)",
                    }
                )
                theta = "\\varphi^n"
                recursion_tree = {
                    "method": "recursion_tree",
                    "recurrence_type": "linear_shift",
                    "levels": [
                        {
                            "level": 0,
                            "num_nodes_latex": "1",
                            "subproblem_size_latex": "n",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "1",
                        },
                        {
                            "level": 1,
                            "num_nodes_latex": "2",
                            "subproblem_size_latex": "n-1, n-2",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "2",
                        },
                        {
                            "level": 2,
                            "num_nodes_latex": "4",
                            "subproblem_size_latex": "n-2, n-3, n-4",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "4",
                        },
                    ],
                    "height": "n",
                    "summation": {
                        "expression": "\\sum_{i=0}^{n} \\text{(nodos nivel } i) \\approx \\Theta(\\varphi^n)",
                        "theta": theta,
                    },
                    "dominating_level": {
                        "reason": "\\text{Subproblemas superpuestos: crecimiento exponencial } \\Theta(\\varphi^n)"
                    },
                    "table_by_levels": [],
                    "theta": f"\\Theta({theta})",
                }
                self.proof_steps.append({"id": "tree_result", "text": f"T(n) = \\Theta({theta})"})
                recursion_tree = _with_tree_steps(
                    recursion_tree,
                    support_code="RT_UNSUPPORTED_FORM",
                    asymptotic_partial=True,
                )
                return {"success": True, "recursion_tree": recursion_tree}

            # Recursión dentro de FOR (generación de subconjuntos): ramificación → Θ(2^n)
            if self.recurrence.get("branching_subset"):
                recurrence_form = self.recurrence.get("form", "T(n) = T(n-1) + \\Theta(1)")
                self.proof_steps.append(
                    {
                        "id": "tree_extract",
                        "text": f"\\text{{Recurrencia identificada }} {recurrence_form}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step1_note",
                        "text": "\\text{Nota: Recursión dentro de FOR (generación de subconjuntos). En cada nivel hay múltiples ramas; el árbol tiene } O(2^n) \\text{ nodos.}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step2",
                        "text": "\\text{Paso 2: Análisis del árbol de recursión} \\\\ \\text{En cada llamada el FOR genera varias ramas recursivas}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step3",
                        "text": "\\text{Paso 3: Número de nodos} \\\\ \\text{En el nivel } i \\text{, hay en el orden de } 2^i \\text{ nodos}",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step4",
                        "text": "\\text{Paso 4: Altura del árbol} \\\\ \\text{La altura es } \\Theta(n)",
                    }
                )
                self.proof_steps.append(
                    {
                        "id": "step5",
                        "text": "\\text{Paso 5: Costo total} \\\\ \\sum_{i=0}^{n} 2^i = 2^{n+1} - 1 = \\Theta(2^n)",
                    }
                )
                theta = "2^n"
                recursion_tree = {
                    "method": "recursion_tree",
                    "recurrence_type": "linear_shift",
                    "levels": [
                        {
                            "level": 0,
                            "num_nodes_latex": "1",
                            "subproblem_size_latex": "n",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "1",
                        },
                        {
                            "level": 1,
                            "num_nodes_latex": "n",
                            "subproblem_size_latex": "n-1",
                            "cost_per_node_latex": "1",
                            "total_cost_latex": "n",
                        },
                    ],
                    "height": "n",
                    "summation": {
                        "expression": "\\sum_{i=0}^{n} 2^i = 2^{n+1} - 1",
                        "theta": theta,
                    },
                    "dominating_level": {
                        "reason": "\\text{Ramificación: número de nodos } \\Theta(2^n)"
                    },
                    "table_by_levels": [],
                    "theta": f"\\Theta({theta})",
                }
                self.proof_steps.append({"id": "tree_result", "text": f"T(n) = \\Theta({theta})"})
                recursion_tree = _with_tree_steps(
                    recursion_tree,
                    support_code="RT_UNSUPPORTED_FORM",
                    asymptotic_partial=True,
                )
                return {"success": True, "recursion_tree": recursion_tree}

        # Paso 1: Extraer parámetros de la recurrencia (divide-and-conquer)
        a = self.recurrence.get("a", 1)
        b = self.recurrence.get("b", 2)
        f_n = self.recurrence.get("f", "n")
        n0 = self.recurrence.get("n0", 1)

        self.proof_steps.append(
            {
                "id": "tree_extract",
                "text": f"T(n) = {a} \\cdot T(n/{self._simplify_number_latex(b)}) + {f_n}",
            }
        )

        # Paso 2-3: Construir niveles del árbol
        levels = self._build_tree_levels(a, b, f_n, n0)

        # Paso 4: Calcular altura
        height_expr = f"\\log_{{{self._simplify_number_latex(b)}}}(n)"
        if n0 == 1:
            height_latex = f"h = {height_expr}"
        else:
            height_latex = (
                f"h = {height_expr} \\approx \\log_{{{self._simplify_number_latex(b)}}}(n)"
            )

        self.proof_steps.append({"id": "tree_height", "text": height_latex})

        # Paso 5: Calcular sumatoria
        summation_result = self._calculate_tree_sum(levels, a, b, f_n)

        self.proof_steps.append(
            {
                "id": "tree_summation",
                "text": f"T(n) = \\sum_{{i=0}}^{{{height_expr}}} a^i \\cdot f(n/b^i) = {summation_result['expression']}",
            }
        )

        # Paso 6: Identificar nivel dominante
        dominating_level = self._identify_dominating_level(levels, a, b, f_n)

        # El reason ya viene con LaTeX formateado completamente
        self.proof_steps.append(
            {
                "id": "tree_dominating",
                "text": f"\\text{{Nivel dominante: }} {dominating_level['reason']}",
            }
        )

        # Paso 7: Resultado final
        theta = summation_result.get("theta", f"\\Theta({f_n})")

        # Corrección específica para recursión tipo búsqueda binaria:
        # T(n) = T(n/2) + Θ(1) → Θ(log n)
        try:
            f_simplified = f_n.replace(" ", "").lower()
            if a == 1 and self._simplify_number_latex(b) == "2":
                if f_simplified in ("1", "theta(1)", "\\theta(1)", "o(1)"):
                    theta = "\\Theta(\\log n)"
                    summation_result["theta"] = theta
        except Exception:
            # Si algo falla en la detección, mantener el theta original
            pass

        self.proof_steps.append({"id": "tree_result", "text": f"T(n) = {theta}"})

        # Construir tabla por niveles para UI
        table_by_levels = []
        for i, level in enumerate(levels):
            table_by_levels.append(
                {
                    "level": i,
                    "num_nodes": level["num_nodes_latex"],
                    "subproblem_size": level["subproblem_size_latex"],
                    "cost_per_node": level["cost_per_node_latex"],
                    "total_cost": level["total_cost_latex"],
                }
            )

        recursion_tree = {
            "method": "recursion_tree",
            "recurrence_type": "divide_conquer",
            "levels": levels,
            "height": height_expr,
            "summation": summation_result,
            "dominating_level": dominating_level,
            "table_by_levels": table_by_levels,
            "theta": theta,
        }
        evaluated_expr = str(summation_result.get("evaluated", "") or "")
        raw_expr = str(summation_result.get("expression", "") or "")
        summation_partial = (
            not evaluated_expr
            or evaluated_expr.strip() == raw_expr.strip()
            or (
                "\\sum" in evaluated_expr
                and "\\Theta" not in evaluated_expr
                and "=" not in evaluated_expr
            )
        )
        f_n_normalized = str(f_n).replace(" ", "").lower()
        if "log" in f_n_normalized:
            summation_partial = True
        tree_inconsistent = str(dominating_level.get("level", "")).lower() == "unknown"
        asymptotic_partial = summation_partial or tree_inconsistent or not theta
        recursion_tree = _with_tree_steps(
            recursion_tree,
            summation_partial=summation_partial,
            tree_inconsistent=tree_inconsistent,
            asymptotic_partial=asymptotic_partial,
        )

        return {"success": True, "recursion_tree": recursion_tree}

    def _build_tree_levels(self, a: int, b: float, f_n: str, n0: int) -> List[Dict[str, Any]]:
        """
        Construye la información de cada nivel del árbol de recursión.

        Args:
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n) (LaTeX)
            n0: Caso base

        Returns:
            Lista de diccionarios con información de cada nivel
        """
        levels = []

        # Calcular número máximo de niveles (hasta llegar al caso base)
        # h ≈ log_b(n), pero generamos suficientes niveles para llenar el modal
        max_levels = 10  # Generar 10 niveles para visualización

        # Detectar tipo de f(n) para simplificar notación
        f_simplified = f_n.strip().lower()
        is_constant = (
            f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1"
        )

        for i in range(max_levels + 1):
            # Número de nodos en el nivel i: a^i
            num_nodes = a**i
            # Usar llaves en el exponente para que KaTeX/Tex interpreten correctamente valores de más de un dígito (ej. 2^{10})
            num_nodes_latex = f"{a}^{{{i}}}" if i > 0 else "1"

            # Tamaño del subproblema en el nivel i: n/b^i
            if i == 0:
                subproblem_size_latex = "n"
            else:
                b_str = self._simplify_number_latex(b)
                subproblem_size_latex = f"n/{b_str}^{{{i}}}"

            # Costo por nodo: ajustar según el tipo de f(n)
            # - Si f(n) es constante: mostrar la constante
            # - Si f(n) = n: mostrar explícitamente n/b^i
            # - En otros casos: notación genérica f(n/b^i)
            if is_constant:
                cost_per_node_latex = f_n
            elif i == 0:
                cost_per_node_latex = f_n
            else:
                b_str = self._simplify_number_latex(b)
                if f_simplified == "n":
                    cost_per_node_latex = f"n/{b_str}^{{{i}}}"
                else:
                    cost_per_node_latex = f"f(n/{b_str}^{i})"

            # Costo total del nivel: a^i · f(n/b^i)
            # Si f(n) es constante, simplificar a^i · c
            if is_constant:
                if i == 0:
                    total_cost_latex = f_n
                else:
                    total_cost_latex = f"{a}^{i} \\cdot {f_n}"
            elif i == 0:
                total_cost_latex = f_n
            else:
                b_str = self._simplify_number_latex(b)
                if f_simplified == "n":
                    total_cost_latex = f"{a}^{{{i}}} \\cdot n/{b_str}^{{{i}}}"
                else:
                    total_cost_latex = f"{a}^{{{i}}} \\cdot f(n/{b_str}^{{{i}}})"

            levels.append(
                {
                    "level": i,
                    "num_nodes": num_nodes,
                    "num_nodes_latex": num_nodes_latex,
                    "subproblem_size_latex": subproblem_size_latex,
                    "cost_per_node_latex": cost_per_node_latex,
                    "total_cost_latex": total_cost_latex,
                }
            )

        return levels

    def _calculate_tree_sum(
        self, levels: List[Dict[str, Any]], a: int, b: float, f_n: str
    ) -> Dict[str, str]:
        """
        Calcula la sumatoria de costos por niveles.

        Args:
            levels: Lista de niveles del árbol
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n)

        Returns:
            {"expression": str, "evaluated": str, "theta": str}
        """
        b_str = self._simplify_number_latex(b)
        height_expr = f"\\log_{{{b_str}}}(n)"

        # Evaluar según el tipo de f(n)
        f_simplified = f_n.strip().lower()

        # Construir expresión de la sumatoria (simplificar si f(n) es constante)
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            # Si f(n) es constante, no usar notación de evaluación
            expression = f"\\sum_{{i=0}}^{{{height_expr}}} {a}^i \\cdot {f_n}"
        else:
            # Notación más legible: f(n/b^i) en lugar de f(n)|_{n/b^i}
            expression = f"\\sum_{{i=0}}^{{{height_expr}}} {a}^i \\cdot f(n/{b_str}^i)"

        # Caso 1: f(n) = constante (1, c)
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            # Σ a^i · c = c · Σ a^i = c · (a^(log_b(n)+1) - 1)/(a - 1)
            # Si a = b, entonces: Σ a^i = Σ 1^i = log_b(n) + 1 ≈ log_b(n)
            # Pero el costo real es: Σ a^i = (a^(log_b(n)+1) - 1)/(a - 1)
            # Si a = b: Σ b^i = (b^(log_b(n)+1) - 1)/(b - 1) = (b·n - 1)/(b - 1) ≈ n
            if a == int(b):
                # Suma geométrica: Σ b^i desde i=0 hasta log_b(n) = (b^(log_b(n)+1) - 1)/(b - 1) = (b·n - 1)/(b - 1) = Θ(n)
                evaluated = f"{f_n} \\cdot \\sum_{{i=0}}^{{{height_expr}}} {a}^i = {f_n} \\cdot \\frac{{{a}^{{\\log_{{{b_str}}}(n)+1}} - 1}}{{{a} - 1}} = {f_n} \\cdot \\frac{{{a} \\cdot n - 1}}{{{a} - 1}}"
                theta = "\\Theta(n)"
            else:
                # Si a ≠ b, el término dominante es a^log_b(n) = n^log_b(a)
                evaluated = f"{f_n} \\cdot \\sum_{{i=0}}^{{{height_expr}}} {a}^i = {f_n} \\cdot \\frac{{{a}^{{\\log_{{{b_str}}}(n)+1}} - 1}}{{{a} - 1}} \\approx {f_n} \\cdot n^{{\\log_{{{b_str}}} {a}}}"
                theta = f"\\Theta(n^{{\\log_{{{b_str}}} {a}}})"

        # Caso 2: f(n) = n (lineal)
        elif f_simplified == "n" or "n" in f_simplified and "^" not in f_simplified:
            # Σ a^i · (n/b^i) = n · Σ (a/b)^i
            # Si a = b, entonces Σ 1^i = log_b(n), entonces T(n) = n·log_b(n)
            if a == int(b):
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} 1 = n \\cdot {height_expr}"
                theta = "\\Theta(n \\log n)"
            # Si a < b, la suma converge: n · (1 - (a/b)^(log_b(n)+1))/(1 - a/b) ≈ n
            elif a < b:
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str})^i \\approx n"
                theta = "\\Theta(n)"
            # Si a > b, domina el último nivel: n · (a/b)^(log_b(n)) ≈ n · a^log_b(n) / b^log_b(n) = n^log_b(a)
            else:
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str})^i \\approx n^{{\\log_{{{b_str}}} {a}}}"
                theta = f"\\Theta(n^{{\\log_{{{b_str}}} {a}}})"

        # Caso 3: f(n) = n^2 (cuadrática)
        elif "^2" in f_simplified or "n^2" in f_simplified:
            # Similar al caso anterior pero con n^2
            if a == int(b):
                evaluated = (
                    f"n^2 \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str}^2)^i \\approx n^2"
                )
                theta = "\\Theta(n^2)"
            else:
                evaluated = f"n^2 \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str}^2)^i"
                theta = "\\Theta(n^2)"

        # Caso por defecto: usar expresión general
        else:
            evaluated = expression
            theta = f"\\Theta({f_n} \\cdot n^{{\\log_{{{b_str}}} {a}}})"

        return {"expression": expression, "evaluated": evaluated, "theta": theta}

    def _identify_dominating_level(
        self, levels: List[Dict[str, Any]], a: int, b: float, f_n: str
    ) -> Dict[str, Any]:
        """
        Identifica qué nivel del árbol domina el costo total.

        Args:
            levels: Lista de niveles del árbol
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n)

        Returns:
            {"level": int|str, "reason": str}
        """
        f_simplified = f_n.strip().lower()

        # Comparar n^log_b(a) con f(n)
        # Si f(n) = O(n^log_b(a) - ε), entonces dominan las hojas (caso 1)
        # Si f(n) = Θ(n^log_b(a)), entonces trabajo equilibrado (caso 2)
        # Si f(n) = Ω(n^log_b(a) + ε), entonces domina la raíz (caso 3)

        b_str = self._simplify_number_latex(b)
        nlogba = f"n^{{\\log_{{{b_str}}} {a}}}"

        # Caso: f(n) = constante
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            if a == int(b):
                # Cuando a=b y f(n)=constante, cada nivel tiene costo a^i·c
                # El nivel i tiene costo 3^i·c, así que los niveles más profundos tienen mayor costo
                # Pero el costo total es Θ(n) debido a la suma geométrica
                return {
                    "level": "leaves",
                    "reason": f"{a}^{{i}} \\text{{ (cada nodo tiene costo }} {f_n} \\text{{)}} \\\\ \\text{{Último nivel tiene costo }} \\Theta(n)",
                }
            else:
                if a > b:
                    return {
                        "level": "leaves",
                        "reason": f"\\text{{Trabajo en hojas }} {nlogba} \\\\ \\text{{Trabajo en raíz }} {f_n}",
                    }
                else:
                    return {
                        "level": "root",
                        "reason": f"\\text{{Trabajo en raíz }} {f_n} \\\\ \\text{{Trabajo en hojas (}} a < b \\text{{)}}",
                    }

        # Caso: f(n) = n
        elif f_simplified == "n":
            if a == int(b):
                return {
                    "level": "all",
                    "reason": "\\text{Cada nivel tiene costo } n \\\\ \\text{Total } = n \\cdot \\log n",
                }
            elif a < b:
                return {
                    "level": "root",
                    "reason": f"\\text{{Trabajo en raíz }} {f_n} \\\\ \\text{{Trabajo en hojas}}",
                }
            else:
                return {
                    "level": "leaves",
                    "reason": f"\\text{{Trabajo en hojas }} {nlogba} \\\\ \\text{{Trabajo en raíz }} {f_n}",
                }

        # Caso por defecto
        else:
            return {
                "level": "unknown",
                "reason": f"\\text{{Depende de la relación entre }} {f_n} \\text{{ y }} {nlogba}",
            }
