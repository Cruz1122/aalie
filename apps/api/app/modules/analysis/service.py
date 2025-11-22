"""
Servicio de análisis de algoritmos.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, Optional
from .analyzers.registry import AnalyzerRegistry
from .analyzers.iterative import IterativeAnalyzer
from .analyzers.recursive import RecursiveAnalyzer
from .analyzers.dummy import create_dummy_analysis
from ..classification.classifier import detect_algorithm_kind
from ..parsing.service import parse_source


def analyze_algorithm(
    source: str,
    mode: str = "worst",
    api_key: Optional[str] = None,
    avg_model: Optional[Dict[str, Any]] = None,
    algorithm_kind: Optional[str] = None,
    preferred_method: Optional[str] = None
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
        
    Returns:
        Resultado del análisis con estructura AnalyzeOpenResponse o diccionario con worst/best/avg
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    
    Example:
        >>> result = analyze_algorithm("factorial(n) BEGIN RETURN 1; END", mode="all")
        >>> print(result["ok"])
        True
    """
    try:
        # 1) Parsear el código fuente
        parse_result = parse_source(source)
        if not parse_result.get("ok", False):
            return {
                "ok": False,
                "errors": parse_result.get("errors", [])
            }
        
        ast = parse_result.get("ast")
        if not ast:
            return {
                "ok": False,
                "errors": [{"message": "No se pudo obtener el AST del código", "line": None, "column": None}]
            }
        
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
            analyzer_worst = analyzer_class()
            analyzer_best = analyzer_class()
            analyzer_avg = analyzer_class()
            
            # Analizar worst y best
            if isinstance(analyzer_worst, RecursiveAnalyzer) and preferred_method:
                result_worst = analyzer_worst.analyze(ast, "worst", preferred_method=preferred_method)
                result_best = analyzer_best.analyze(ast, "best", preferred_method=preferred_method)
            else:
                result_worst = analyzer_worst.analyze(ast, "worst")
                result_best = analyzer_best.analyze(ast, "best")
            
            if not result_worst.get("ok", False):
                return result_worst
            if not result_best.get("ok", False):
                return result_best
            
            # Preparar avgModel para caso promedio
            if avg_model:
                avg_model_dict = avg_model
            else:
                avg_model_dict = {"mode": "uniform", "predicates": {}}
            
            # Analizar caso promedio
            if isinstance(analyzer_avg, RecursiveAnalyzer) and preferred_method:
                result_avg = analyzer_avg.analyze(ast, "avg", api_key=api_key, avg_model=avg_model_dict, preferred_method=preferred_method)
            else:
                result_avg = analyzer_avg.analyze(ast, "avg", api_key=api_key, avg_model=avg_model_dict)
            
            if not result_avg.get("ok", False):
                print(f"[analyze_algorithm] Error en análisis promedio: {result_avg.get('errors', [])}")
                result_avg = None
            
            # Verificar variabilidad
            has_variability = True
            if result_worst.get("ok") and result_best.get("ok"):
                worst_t_open = result_worst.get("totals", {}).get("T_open", "")
                best_t_open = result_best.get("totals", {}).get("T_open", "")
                worst_recurrence = result_worst.get("totals", {}).get("recurrence")
                best_recurrence = result_best.get("totals", {}).get("recurrence")
                
                if worst_t_open == best_t_open and worst_recurrence == best_recurrence:
                    if result_avg and result_avg.get("ok"):
                        avg_t_open = result_avg.get("totals", {}).get("T_open", "")
                        avg_recurrence = result_avg.get("totals", {}).get("recurrence")
                        if (avg_t_open == worst_t_open and avg_recurrence == worst_recurrence):
                            if isinstance(analyzer_worst, RecursiveAnalyzer):
                                has_variability = analyzer_worst._has_case_variability()
                    else:
                        if isinstance(analyzer_worst, RecursiveAnalyzer):
                            has_variability = analyzer_worst._has_case_variability()
            
            # Construir respuesta
            if not has_variability:
                response = {
                    "ok": True,
                    "has_case_variability": False,
                    "worst": result_worst,
                    "best": "same_as_worst",
                    "avg": "same_as_worst" if result_avg else None
                }
            else:
                response = {
                    "ok": True,
                    "has_case_variability": True,
                    "worst": result_worst,
                    "best": result_best
                }
                if result_avg:
                    response["avg"] = result_avg
            
            return response
        else:
            # Analizar solo el caso solicitado
            analyzer = analyzer_class()
            
            # Preparar avgModel si mode == "avg"
            if mode == "avg" and avg_model:
                avg_model_dict = avg_model
            elif mode == "avg":
                avg_model_dict = {"mode": "uniform", "predicates": {}}
            else:
                avg_model_dict = None
            
            # Ejecutar análisis
            if isinstance(analyzer, RecursiveAnalyzer) and preferred_method:
                result = analyzer.analyze(ast, mode, api_key=api_key, avg_model=avg_model_dict, preferred_method=preferred_method)
            else:
                result = analyzer.analyze(ast, mode, api_key=api_key, avg_model=avg_model_dict)
            return result
        
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }


def detect_methods(
    source: str,
    algorithm_kind: Optional[str] = None
) -> Dict[str, Any]:
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
            return {
                "ok": False,
                "errors": parse_result.get("errors", [])
            }
        
        ast = parse_result.get("ast")
        if not ast:
            return {
                "ok": False,
                "errors": [{"message": "No se pudo obtener el AST del código", "line": None, "column": None}]
            }
        
        # 2) Determinar el tipo de algoritmo
        if not algorithm_kind:
            algorithm_kind = detect_algorithm_kind(ast)
        
        # Solo detectar métodos para algoritmos recursivos
        if algorithm_kind not in ["recursive", "hybrid"]:
            return {
                "ok": False,
                "errors": [{"message": "Este endpoint solo es para algoritmos recursivos", "line": None, "column": None}]
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
            "recurrence_info": applicable_methods.get("recurrence_info")
        }
        
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error detectando métodos: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

