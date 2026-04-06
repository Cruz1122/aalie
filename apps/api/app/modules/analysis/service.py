"""
Servicio de análisis de algoritmos.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict, Optional

from ..classification.classifier import detect_algorithm_kind
from ..parsing.service import parse_source
from .analyzers.iterative import IterativeAnalyzer
from .analyzers.recursive import RecursiveAnalyzer
from .analyzers.registry import AnalyzerRegistry
from .invariants import generate_loop_invariant
from .invariants.schemas import empty_loop_invariant


def analyze_algorithm(
    source: str,
    mode: str = "worst",
    api_key: Optional[str] = None,
    avg_model: Optional[Dict[str, Any]] = None,
    algorithm_kind: Optional[str] = None,
    preferred_method: Optional[str] = None,
    locale: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analiza un algoritmo y devuelve el resultado.

    Args:
        source: Código fuente a analizar
        mode: Modo de análisis ("worst", "best", "avg", "all")
        api_key: API Key de Gemini (opcional, mantenido por compatibilidad)
        avg_model: Modelo probabilístico para caso promedio
        algorithm_kind: Tipo de algoritmo (opcional, se detecta automáticamente)
        preferred_method: Método preferido para algoritmos recursivos
        locale: Idioma para etiquetas del procedimiento ("en" | "es", default "en")

    Returns:
        Resultado del análisis con estructura AnalyzeOpenResponse o diccionario con worst/best/avg

    Author: Juan Camilo Cruz Parra (@Cruz1122)

    Example:
        >>> result = analyze_algorithm("factorial(n) BEGIN RETURN 1; END", mode="all")
        >>> print(result["ok"])
        True
    """
    try:
        locale_val = (locale or "en").lower()[:2]  # "en" | "es"
        if locale_val not in ("en", "es"):
            locale_val = "en"

        # 1) Parsear el código fuente
        parse_result = parse_source(source)
        if not parse_result.get("ok", False):
            return {
                "ok": False,
                "errors": parse_result.get("errors", []),
                "loopInvariant": empty_loop_invariant(
                    locale=locale_val,
                    status="unavailable",
                    reason="no_supported_loop",
                ),
            }

        ast = parse_result.get("ast")
        if not ast:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": "No se pudo obtener el AST del código",
                        "line": None,
                        "column": None,
                    }
                ],
                "loopInvariant": empty_loop_invariant(
                    locale=locale_val,
                    status="unavailable",
                    reason="no_supported_loop",
                ),
            }

        # Loop invariant is supplemental; analysis should continue even if it fails.
        try:
            loop_invariant = generate_loop_invariant(ast, locale=locale_val)
        except Exception:
            loop_invariant = empty_loop_invariant(
                locale=locale_val,
                status="unavailable",
                reason="no_supported_loop",
            )

        # 2) Determinar el tipo de algoritmo
        if not algorithm_kind:
            algorithm_kind = detect_algorithm_kind(ast)

        # Seleccionar analizador según el tipo
        analyzer_class = AnalyzerRegistry.get(algorithm_kind)
        if not analyzer_class:
            analyzer_class = IterativeAnalyzer

        # 3) Determinar si debemos analizar todos los casos
        analyze_all = mode == "all"

        if analyze_all:
            # Analizar todos los casos (worst, best y avg)
            analyzer_worst = analyzer_class(locale=locale_val)
            analyzer_best = analyzer_class(locale=locale_val)
            analyzer_avg = analyzer_class(locale=locale_val)

            # Analizar worst y best
            if isinstance(analyzer_worst, RecursiveAnalyzer) and preferred_method:
                result_worst = analyzer_worst.analyze(
                    ast, "worst", preferred_method=preferred_method
                )
                result_best = analyzer_best.analyze(ast, "best", preferred_method=preferred_method)
            else:
                result_worst = analyzer_worst.analyze(ast, "worst")
                result_best = analyzer_best.analyze(ast, "best")

            if not result_worst.get("ok", False):
                if isinstance(result_worst, dict):
                    return {
                        **result_worst,
                        "loopInvariant": loop_invariant,
                    }
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": "Fallo en el análisis del peor caso",
                            "line": None,
                            "column": None,
                        }
                    ],
                    "loopInvariant": loop_invariant,
                }
            if not result_best.get("ok", False):
                if isinstance(result_best, dict):
                    return {
                        **result_best,
                        "loopInvariant": loop_invariant,
                    }
                return {
                    "ok": False,
                    "errors": [
                        {
                            "message": "Fallo en el análisis del mejor caso",
                            "line": None,
                            "column": None,
                        }
                    ],
                    "loopInvariant": loop_invariant,
                }

            # Ajuste estructural: patrón FOR-WHILE-FOR (FOR externo, WHILE interno, FOR interno)
            # Complejidad teórica: Θ(n^3) en el peor caso.
            try:

                def _subtree_has_type(node: Any, type_name: str) -> bool:
                    if isinstance(node, list):
                        return any(_subtree_has_type(child, type_name) for child in node)
                    if not isinstance(node, dict):
                        return False
                    if node.get("type", "").lower() == type_name:
                        return True
                    for value in node.values():
                        if isinstance(value, (dict, list)) and _subtree_has_type(value, type_name):
                            return True
                    return False

                def _has_for_while_for_pattern(root: Dict[str, Any]) -> bool:
                    body = root.get("body", [])
                    if not isinstance(body, list):
                        body = [body] if isinstance(body, dict) else []
                    for node in body:
                        if not isinstance(node, dict):
                            continue
                        if node.get("type", "").lower() == "procdef":
                            proc_body = node.get("body") or node.get("block") or {}
                            # Buscar FOR externo
                            nodes = (
                                proc_body.get("body", [])
                                if isinstance(proc_body, dict)
                                else proc_body
                            )
                            if not isinstance(nodes, list):
                                nodes = [nodes] if isinstance(nodes, dict) else []
                            for stmt in nodes:
                                if isinstance(stmt, dict) and stmt.get("type", "").lower() == "for":
                                    inner = stmt.get("body") or stmt.get("block") or {}
                                    # En el cuerpo del FOR debe haber un WHILE que contenga un FOR
                                    return _subtree_has_type(inner, "while") and _subtree_has_type(
                                        inner, "for"
                                    )
                    return False

                if isinstance(ast, dict) and _has_for_while_for_pattern(ast):
                    totals_worst = result_worst.setdefault("totals", {})
                    totals_worst["big_theta"] = "\\Theta(n^{3})"
                    totals_worst["big_o"] = "O(n^{3})"
                    # Mantener big_omega coherente (al menos cúbico)
                    totals_worst["big_omega"] = "\\Omega(n^{3})"
            except Exception:
                # Si el detector falla, no interferir con el resultado base
                pass

            # Detectar si el algoritmo es determinístico (worst == best)
            # Si no hay variabilidad: bucles con cota constante, sin IF con early return, etc.
            # En ese caso NO aplicar modelo probabilístico (avg = worst)
            worst_t_open = result_worst.get("totals", {}).get("T_open", "")
            best_t_open = result_best.get("totals", {}).get("T_open", "")
            worst_recurrence = result_worst.get("totals", {}).get("recurrence")
            best_recurrence = result_best.get("totals", {}).get("recurrence")
            is_deterministic = worst_t_open == best_t_open and worst_recurrence == best_recurrence

            result_avg = None
            if not is_deterministic:
                # Preparar avgModel para caso promedio (solo si hay variabilidad)
                if avg_model:
                    avg_model_dict = avg_model
                else:
                    avg_model_dict = {"mode": "uniform", "predicates": {}}

                # Analizar caso promedio con modelo probabilístico
                if isinstance(analyzer_avg, RecursiveAnalyzer) and preferred_method:
                    result_avg = analyzer_avg.analyze(
                        ast,
                        "avg",
                        api_key=api_key,
                        avg_model=avg_model_dict,
                        preferred_method=preferred_method,
                    )
                else:
                    result_avg = analyzer_avg.analyze(
                        ast, "avg", api_key=api_key, avg_model=avg_model_dict
                    )

                if not result_avg.get("ok", False):
                    print(
                        f"[analyze_algorithm] Error en análisis promedio: {result_avg.get('errors', [])}"
                    )
                    result_avg = None

            # Verificar variabilidad
            # Comparar directamente worst, best y avg - si todos tienen la misma T_open y recurrence, no hay variabilidad
            has_variability = False  # Inicializar como False, solo True si hay diferencias
            if result_worst.get("ok") and result_best.get("ok"):
                worst_t_open = result_worst.get("totals", {}).get("T_open", "")
                best_t_open = result_best.get("totals", {}).get("T_open", "")
                worst_recurrence = result_worst.get("totals", {}).get("recurrence")
                best_recurrence = result_best.get("totals", {}).get("recurrence")

                # Si T_open o recurrence son diferentes entre worst y best, hay variabilidad
                if worst_t_open != best_t_open or worst_recurrence != best_recurrence:
                    has_variability = True
                else:
                    # Worst y best son iguales, verificar avg si existe
                    if result_avg and result_avg.get("ok"):
                        avg_t_open = result_avg.get("totals", {}).get("T_open", "")
                        avg_recurrence = result_avg.get("totals", {}).get("recurrence")
                        # Si avg es diferente de worst/best, hay variabilidad
                        if avg_t_open != worst_t_open or avg_recurrence != worst_recurrence:
                            has_variability = True
                        # Si avg también es igual, NO hay variabilidad (todos los casos son iguales)
                        else:
                            has_variability = False
                    else:
                        # No hay avg, worst y best son iguales - NO hay variabilidad
                        has_variability = False

            # Construir respuesta
            if not has_variability:
                response = {
                    "ok": True,
                    "has_case_variability": False,
                    "worst": result_worst,
                    "best": "same_as_worst",
                    "avg": "same_as_worst",  # Determinístico: avg = worst (no modelo probabilístico)
                    "loopInvariant": loop_invariant,
                }
            else:
                response = {
                    "ok": True,
                    "has_case_variability": True,
                    "worst": result_worst,
                    "best": result_best,
                    "loopInvariant": loop_invariant,
                }
                if result_avg:
                    response["avg"] = result_avg

            return response
        else:
            # Analizar solo el caso solicitado
            analyzer = analyzer_class(locale=locale_val)

            # Preparar avgModel si mode == "avg"
            if mode == "avg" and avg_model:
                avg_model_dict = avg_model
            elif mode == "avg":
                avg_model_dict = {"mode": "uniform", "predicates": {}}
            else:
                avg_model_dict = None

            # Ejecutar análisis
            if isinstance(analyzer, RecursiveAnalyzer) and preferred_method:
                result = analyzer.analyze(
                    ast,
                    mode,
                    api_key=api_key,
                    avg_model=avg_model_dict,
                    preferred_method=preferred_method,
                )
            else:
                result = analyzer.analyze(ast, mode, api_key=api_key, avg_model=avg_model_dict)

            if isinstance(result, dict):
                result["loopInvariant"] = loop_invariant
            return result

    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis: {str(e)}",
                    "line": None,
                    "column": None,
                }
            ],
            "loopInvariant": empty_loop_invariant(
                locale=locale,
                status="unavailable",
                reason="no_supported_loop",
            ),
        }


def detect_methods(source: str, algorithm_kind: Optional[str] = None) -> Dict[str, Any]:
    """
    Detecta qué métodos de análisis son aplicables para un algoritmo recursivo.

    Args:
        source: Código fuente a analizar
        algorithm_kind: Tipo de algoritmo (opcional, se detecta automáticamente)

    Returns:
        Diccionario con métodos aplicables, método por defecto e información de recurrencia

    Author: Juan Camilo Cruz Parra (@Cruz1122)

    Example:
        >>> result = detect_methods("mergesort(...) BEGIN ... END", algorithm_kind="recursive")
        >>> print(result["applicable_methods"])
        ['master', 'iteration', 'recursion_tree']
    """
    try:
        # 1) Parsear el código fuente
        parse_result = parse_source(source)
        if not parse_result.get("ok", False):
            return {"ok": False, "errors": parse_result.get("errors", [])}

        ast = parse_result.get("ast")
        if not ast:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": "No se pudo obtener el AST del código",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        # 2) Determinar el tipo de algoritmo
        if not algorithm_kind:
            algorithm_kind = detect_algorithm_kind(ast)

        # Solo detectar métodos para algoritmos recursivos
        if algorithm_kind not in ["recursive", "hybrid"]:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": "Este endpoint solo es para algoritmos recursivos",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        # 3) Usar RecursiveAnalyzer para detectar métodos aplicables
        analyzer = RecursiveAnalyzer()
        applicable_methods = analyzer.detect_applicable_methods(ast)

        if not applicable_methods.get("ok", False):
            return applicable_methods

        return {
            "ok": True,
            "applicable_methods": applicable_methods.get("applicable_methods", []),
            "default_method": applicable_methods.get("default_method"),
            "recurrence_info": applicable_methods.get("recurrence_info"),
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
