"""
Router para el módulo de analysis.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from fastapi import APIRouter, Body
from typing import Any, Dict
from .service import analyze_algorithm, detect_methods
from .analyzers.dummy import create_dummy_analysis
from .schemas import AnalyzeRequest, TraceRequest, TraceResponse
from ..parsing.service import parse_source
from ..classification.service import classify_algorithm as classify_algo
from ..execution.executor import CodeExecutor

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("/open")
def analyze_open(payload: AnalyzeRequest = Body(...)) -> Dict[str, Any]:
    """
    Analiza un algoritmo y devuelve el contrato mínimo:
    - byLine: tabla por línea
    - totals.T_open: ecuación de eficiencia abierta
    - totals.procedure: pasos para construir T_open
    
    Si mode="all", devuelve todos los casos (worst, best y avg) en una sola respuesta.
    Si mode="avg", se requiere avgModel para el análisis de caso promedio.
    
    Args:
        payload: Solicitud de análisis con código fuente, modo, y opciones
        
    Returns:
        Resultado del análisis según el modo solicitado
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # Preparar avg_model
    avg_model = None
    if payload.avgModel:
        avg_model = {
            "mode": payload.avgModel.mode,
            "predicates": payload.avgModel.predicates or {}
        }
    
    return analyze_algorithm(
        source=payload.source,
        mode=payload.mode,
        api_key=payload.api_key,
        avg_model=avg_model,
        algorithm_kind=payload.algorithm_kind,
        preferred_method=payload.preferred_method
    )


@router.post("/detect-methods")
def detect_methods_endpoint(payload: AnalyzeRequest = Body(...)) -> Dict[str, Any]:
    """
    Detecta qué métodos de análisis son aplicables para un algoritmo recursivo
    sin ejecutar el análisis completo.
    
    Retorna una lista de métodos aplicables: ["characteristic_equation", "iteration", "recursion_tree", "master"]
    
    Args:
        payload: Solicitud con código fuente y tipo de algoritmo (opcional)
        
    Returns:
        Diccionario con métodos aplicables, método por defecto e información de recurrencia
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    return detect_methods(
        source=payload.source,
        algorithm_kind=payload.algorithm_kind
    )


@router.get("/dummy")
def analyze_dummy() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar la funcionalidad de BaseAnalyzer.
    Devuelve un análisis dummy con datos de ejemplo.
    
    Returns:
        Resultado de análisis dummy para pruebas
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    try:
        result = create_dummy_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis dummy: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }


@router.post("/trace")
def analyze_trace(payload: TraceRequest = Body(...)) -> Dict[str, Any]:
    """
    Genera un rastro de ejecución paso a paso del pseudocódigo.
    Para algoritmos iterativos: devuelve trace completo con pasos.
    Para algoritmos recursivos/híbridos: devuelve metadatos mínimos sin trace detallado.
    
    Args:
        payload: Solicitud con código fuente, caso y tamaño de entrada
        
    Returns:
        Rastro de ejecución con pasos detallados (iterativos) o metadatos (recursivos/híbridos)
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    try:
        # 1) Parsear el código fuente
        parse_result = parse_source(payload.source)
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
        
        # 2) Clasificar el algoritmo
        classification_result = classify_algo(ast=ast)
        algorithm_kind = classification_result.get("kind", "unknown")
        
        # 3) Determinar si construir trace detallado
        is_recursive_or_hybrid = algorithm_kind in ["recursive", "hybrid"]
        
        # 4) Ejecutar y generar rastro
        if is_recursive_or_hybrid:
            # Para recursivos/híbridos: no construir trace detallado
            # Solo devolver metadatos básicos
            return {
                "ok": True,
                "algorithmKind": algorithm_kind,
                "trace": None,
                "metadata": {
                    "pseudocode": payload.source,
                    "inputSize": payload.input_size,
                    "case": payload.case,
                    "message": "Para algoritmos recursivos e híbridos, el diagrama se genera en el frontend mediante LLM"
                }
            }
        else:
            # Para iterativos: trace completo como siempre
            executor = CodeExecutor(
                ast, 
                payload.input_size, 
                payload.case,
                initial_variables=payload.initial_variables
            )
            trace = executor.execute()
            
            return {
                "ok": True,
                "trace": trace,
                "algorithmKind": algorithm_kind
            }
        
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error generando rastro: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }


@router.post("/closed")
def analyze_closed(payload: AnalyzeRequest = Body(...)) -> Dict[str, Any]:
    """
    Analiza un algoritmo y devuelve la forma cerrada (S4).
    Por ahora devuelve error ya que es funcionalidad futura.
    
    Args:
        payload: Solicitud de análisis (no utilizado aún)
        
    Returns:
        Error indicando que la funcionalidad no está implementada
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    return {
        "ok": False,
        "errors": [
            {
                "message": "Análisis cerrado no implementado aún (S4)",
                "line": None,
                "column": None
            }
        ]
    }

