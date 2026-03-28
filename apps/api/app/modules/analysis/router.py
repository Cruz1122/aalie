"""
Router para el módulo de analysis.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict

from fastapi import APIRouter, Body

from .schemas import AnalyzeRequest, TraceRequest
from .service import analyze_algorithm, detect_methods
from .trace_service import build_trace_result

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
            "predicates": payload.avgModel.predicates or {},
        }

    return analyze_algorithm(
        source=payload.source,
        mode=payload.mode,
        api_key=payload.api_key,
        avg_model=avg_model,
        algorithm_kind=payload.algorithm_kind,
        preferred_method=payload.preferred_method,
        locale=payload.locale,
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
    return detect_methods(source=payload.source, algorithm_kind=payload.algorithm_kind)


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
    return build_trace_result(
        source=payload.source,
        case=payload.case,
        input_size=payload.input_size,
        initial_variables=payload.initial_variables,
        locale=payload.locale,
    )
