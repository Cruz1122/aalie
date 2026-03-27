"""
Router para el módulo de analysis.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from fastapi import APIRouter, Body
from typing import Any, Dict
from .service import analyze_algorithm, detect_methods
from .schemas import AnalyzeRequest, TraceRequest
from ..parsing.service import parse_source
from ..classification.service import classify_algorithm as classify_algo
from ..execution.executor import CodeExecutor
from ..execution.derivations.structured_trace_builder import build_structured_trace_result
from ..execution.derivations.structured_trace_models import StructuredTraceRenderConfig

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
        preferred_method=payload.preferred_method,
        locale=payload.locale
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


@router.post("/trace")
def analyze_trace(payload: TraceRequest = Body(...)) -> Dict[str, Any]:
    """
    Genera un rastro de ejecución paso a paso del pseudocódigo.
    Devuelve trace completo con pasos para iterativos, recursivos e híbridos.
    
    Args:
        payload: Solicitud con código fuente, caso y tamaño de entrada
        
    Returns:
        Rastro de ejecución con pasos detallados y metadatos de apoyo
        
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
        
        # 3) Ejecutar y generar rastro para cualquier tipo de algoritmo
        locale_val = (payload.locale or "en").lower()[:2]
        if locale_val not in ("en", "es"):
            locale_val = "en"
        executor = CodeExecutor(
            ast,
            payload.input_size,
            payload.case,
            initial_variables=payload.initial_variables,
            locale=locale_val,
        )
        trace = executor.execute()

        metadata_message = "Trace generado correctamente"

        # Enriquecer trace con kind, summary, diagnostics y callTreeSource
        steps = trace.get("steps", [])
        recursion_tree = trace.get("recursionTree", {})
        calls = recursion_tree.get("calls", [])
        max_depth = max((c.get("depth", 0) for c in calls), default=0)
        trace_enriched: Dict[str, Any] = {
            **trace,
            "callTreeSource": recursion_tree if recursion_tree else None,
            "kind": algorithm_kind,
            "summary": {
                "totalSteps": len(steps),
                "totalCalls": len(calls),
                "maxRecursionDepth": max_depth,
                "algorithmKind": algorithm_kind,
            },
            "diagnostics": {
                "truncated": trace.get("recursion_truncated", False),
                "truncationReason": "max_depth" if trace.get("recursion_truncated") else None,
                "warnings": [],
            },
        }

        # Artefactos derivados: structuredTrace (única fuente)
        import logging as _logging
        derived: Dict[str, Any] = {}
        try:
            st = build_structured_trace_result(
                trace_enriched, StructuredTraceRenderConfig(locale=locale_val)
            )
            derived["structuredTrace"] = {
                "patternKind": st["patternKind"],
                "graph": st["graph"],
                "classification": st["classification"],
            }
        except Exception as e:
            _logging.getLogger(__name__).warning(
                "build_structured_trace_result failed: %s", str(e), exc_info=True
            )
            # Siempre devolver structuredTrace para que el frontend pueda distinguir
            # entre "aún no cargado" y "cargado pero el builder falló".
            derived["structuredTrace"] = {
                "patternKind": "unknown",
                "graph": {"nodes": [], "edges": []},
                "classification": {
                    "patternKind": "unknown",
                    "confidence": 0.0,
                    "evidence": [],
                },
                "buildError": str(e),
            }

        result: Dict[str, Any] = {
            "ok": True,
            "trace": trace_enriched,
            "algorithmKind": algorithm_kind,
            "derived": derived,
            "metadata": {
                "pseudocode": payload.source,
                "inputSize": payload.input_size,
                "case": payload.case,
                "message": metadata_message,
            },
        }

        return result
        
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

