from fastapi import APIRouter, Body
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from ..analysis import IterativeAnalyzer, AnalyzerRegistry
from ..analysis.dummy_analyzer import create_dummy_analysis
from ..analysis.algorithm_classifier import detect_algorithm_kind
from ..routers.parse import parse_source

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Modelos Pydantic que reflejan los tipos de @aa/types
class AvgModelConfig(BaseModel):
    mode: str = "uniform"  # "uniform" | "symbolic"
    predicates: Optional[Dict[str, str]] = None  # ej: {"A[j] > A[j+1]": "1/2"}

class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg"
    api_key: Optional[str] = None  # API Key de Gemini (opcional)
    avgModel: Optional[AvgModelConfig] = None  # Modelo probabilístico para caso promedio
    algorithm_kind: Optional[str] = None  # "iterative" | "recursive" | "hybrid" | "unknown" - se detecta automáticamente si no se proporciona

class LineCost(BaseModel):
    line: int
    kind: str  # "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other"
    ck: str
    count: str
    count_raw: str  # Sumatorias sin simplificar
    note: Optional[str] = None

class AnalyzeOpenResponse(BaseModel):
    ok: bool = True
    byLine: List[LineCost]
    totals: Dict[str, Any]

class AnalyzeError(BaseModel):
    ok: bool = False
    errors: List[Dict[str, Any]]

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
        
        # 2) Determinar el tipo de algoritmo
        algorithm_kind = payload.algorithm_kind
        if not algorithm_kind:
            # Detectar automáticamente desde el AST usando el módulo compartido
            algorithm_kind = detect_algorithm_kind(ast)
        
        # Seleccionar analizador según el tipo
        analyzer_class = AnalyzerRegistry.get(algorithm_kind)
        if not analyzer_class:
            # Fallback a iterativo si no se reconoce el tipo
            analyzer_class = IterativeAnalyzer
        
        # 3) Determinar si debemos analizar todos los casos
        analyze_all = payload.mode == "all"
        
        if analyze_all:
            # Analizar todos los casos (worst, best y avg)
            analyzer_worst = analyzer_class()
            analyzer_best = analyzer_class()
            analyzer_avg = analyzer_class()
            
            # Analizar worst y best
            result_worst = analyzer_worst.analyze(ast, "worst")
            result_best = analyzer_best.analyze(ast, "best")
            
            # Verificar que worst y best fueron exitosos
            if not result_worst.get("ok", False):
                return result_worst
            if not result_best.get("ok", False):
                return result_best
            
            # Preparar avgModel para caso promedio
            avg_model_dict = None
            if payload.avgModel:
                avg_model_dict = {
                    "mode": payload.avgModel.mode,
                    "predicates": payload.avgModel.predicates or {}
                }
            else:
                # Por defecto, usar modelo uniforme sin predicados
                avg_model_dict = {
                    "mode": "uniform",
                    "predicates": {}
                }
            
            # Analizar caso promedio
            result_avg = analyzer_avg.analyze(ast, "avg", api_key=payload.api_key, avg_model=avg_model_dict)
            
            # Verificar que avg fue exitoso (si falla, continuar sin él o devolver error)
            # Por ahora, si falla, lo incluimos como None para que el frontend pueda manejarlo
            if not result_avg.get("ok", False):
                # Log del error pero continuar sin avg
                print(f"[analyze_open] Error en análisis promedio: {result_avg.get('errors', [])}")
                result_avg = None
            
            # Devolver todos los casos en una sola respuesta
            response = {
                "ok": True,
                "worst": result_worst,
                "best": result_best
            }
            
            # Incluir avg solo si fue exitoso
            if result_avg:
                response["avg"] = result_avg
            
            return response
        else:
            # Analizar solo el caso solicitado (compatibilidad hacia atrás)
            analyzer = analyzer_class()
            
            # Preparar avgModel si mode == "avg"
            avg_model_dict = None
            if payload.mode == "avg" and payload.avgModel:
                avg_model_dict = {
                    "mode": payload.avgModel.mode,
                    "predicates": payload.avgModel.predicates or {}
                }
            elif payload.mode == "avg":
                # Por defecto, usar modelo uniforme sin predicados
                avg_model_dict = {
                    "mode": "uniform",
                    "predicates": {}
                }
            
            result = analyzer.analyze(ast, payload.mode, api_key=payload.api_key, avg_model=avg_model_dict)
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
