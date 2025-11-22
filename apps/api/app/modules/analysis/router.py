"""
Router para el módulo de analysis.
"""
from fastapi import APIRouter, Body
from typing import Any, Dict
from .service import analyze_algorithm, detect_methods
from .analyzers.dummy import create_dummy_analysis
from .schemas import AnalyzeRequest

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


@router.post("/closed")
def analyze_closed(payload: AnalyzeRequest = Body(...)) -> Dict[str, Any]:
    """
    Analiza un algoritmo y devuelve la forma cerrada (S4).
    Por ahora devuelve error ya que es funcionalidad futura.
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

