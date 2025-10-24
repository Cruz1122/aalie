from fastapi import APIRouter, Body
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from ..analysis.dummy_analyzer import create_dummy_analysis

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Modelos Pydantic que reflejan los tipos de @aa/types
class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg"

class LineCost(BaseModel):
    line: int
    kind: str  # "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other"
    ck: str
    count: str
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
    """
    
    # Fixture de ejemplo para testing
    fixture_response = {
        "ok": True,
        "byLine": [
            {
                "line": 1,
                "kind": "decl",
                "ck": "c_1",
                "count": "1",
                "note": "declaración de variable"
            },
            {
                "line": 2,
                "kind": "for",
                "ck": "c_2 + c_3",
                "count": "n + 1",
                "note": "inicialización del bucle"
            },
            {
                "line": 3,
                "kind": "assign",
                "ck": "c_4 + c_5",
                "count": "n",
                "note": "asignación dentro del bucle"
            },
            {
                "line": 4,
                "kind": "for",
                "ck": "c_6",
                "count": "1",
                "note": "incremento del bucle"
            }
        ],
        "totals": {
            "T_open": "c_1 + (c_2 + c_3) \\cdot (n + 1) + (c_4 + c_5) \\cdot n + c_6",
            "procedure": [
                "T(n) = \\sum_{i=1}^{n} \\text{costo de línea } i",
                "T(n) = c_1 + (c_2 + c_3) \\cdot (n + 1) + (c_4 + c_5) \\cdot n + c_6",
                "T(n) = c_1 + (c_2 + c_3) \\cdot n + (c_2 + c_3) + (c_4 + c_5) \\cdot n + c_6",
                "T(n) = (c_2 + c_3 + c_4 + c_5) \\cdot n + c_1 + c_2 + c_3 + c_6"
            ],
            "symbols": {
                "n": "length(A)",
                "c_1": "costo de declaración",
                "c_2": "costo de asignación en bucle",
                "c_3": "costo de comparación",
                "c_4": "costo de asignación",
                "c_5": "costo de indexación",
                "c_6": "costo de incremento"
            },
            "notes": [
                "Bucle for: n iteraciones + 1 comparación final",
                "Asignación dentro del bucle: n ejecuciones",
                "Incremento: n ejecuciones"
            ]
        }
    }
    
    return fixture_response

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
