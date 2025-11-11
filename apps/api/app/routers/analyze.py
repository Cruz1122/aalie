from fastapi import APIRouter, Body
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from ..analysis import IterativeAnalyzer, AnalyzerRegistry
from ..analysis.dummy_analyzer import create_dummy_analysis
from ..routers.parse import parse_source

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Modelos Pydantic que reflejan los tipos de @aa/types
class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg"
    api_key: Optional[str] = None  # API Key de Gemini (opcional)

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
    
    Si mode="all", devuelve ambos casos (worst y best) en una sola respuesta.
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
        
        # 2) Determinar si debemos analizar ambos casos
        analyze_both = payload.mode == "all"
        
        if analyze_both:
            # Analizar ambos casos (worst y best)
            analyzer_worst = IterativeAnalyzer()
            analyzer_best = IterativeAnalyzer()
            
            result_worst = analyzer_worst.analyze(ast, "worst")
            result_best = analyzer_best.analyze(ast, "best")
            
            # Verificar que ambos análisis fueron exitosos
            if not result_worst.get("ok", False):
                return result_worst
            if not result_best.get("ok", False):
                return result_best
            
            # Devolver ambos casos en una sola respuesta
            return {
                "ok": True,
                "worst": result_worst,
                "best": result_best
            }
        else:
            # Analizar solo el caso solicitado (compatibilidad hacia atrás)
            analyzer = IterativeAnalyzer()
            result = analyzer.analyze(ast, payload.mode)
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
