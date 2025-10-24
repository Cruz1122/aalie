from fastapi import APIRouter, Body
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from ..analysis.dummy_analyzer import create_dummy_analysis
from ..analysis.for_analyzer import create_for_analysis
from ..analysis.nested_for_example import create_nested_for_analysis
from ..analysis.if_analyzer import create_if_analysis, create_if_with_else_analysis
from ..analysis.for_if_combined_example import create_for_if_combined_analysis
from ..analysis.simple_analyzer import create_simple_analysis, create_call_analysis, create_return_analysis
from ..analysis.while_repeat_analyzer import create_while_analysis, create_repeat_analysis, create_while_repeat_combined_analysis

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

@router.get("/for-example")
def analyze_for_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de bucles FOR.
    Devuelve un análisis con un bucle FOR de ejemplo.
    """
    try:
        result = create_for_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de bucle FOR: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/nested-for-example")
def analyze_nested_for_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de bucles FOR anidados.
    Devuelve un análisis con bucles FOR anidados de ejemplo.
    """
    try:
        result = create_nested_for_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de bucles FOR anidados: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/if-example")
def analyze_if_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de condicionales IF.
    Devuelve un análisis con un condicional IF simple de ejemplo.
    """
    try:
        result = create_if_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de condicional IF: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/if-with-else-example")
def analyze_if_with_else_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de condicionales IF con ELSE.
    Devuelve un análisis con un condicional IF con ELSE de ejemplo.
    """
    try:
        result = create_if_with_else_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de condicional IF con ELSE: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/for-if-combined-example")
def analyze_for_if_combined_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar la combinación de bucles FOR con condicionales IF.
    Devuelve un análisis que combina FOR con IF anidado.
    """
    try:
        result = create_for_if_combined_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis combinado FOR-IF: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/simple-example")
def analyze_simple_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de líneas simples.
    Devuelve un análisis con asignaciones simples de ejemplo.
    """
    try:
        result = create_simple_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de líneas simples: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/call-example")
def analyze_call_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de llamadas a función.
    Devuelve un análisis con llamadas de ejemplo.
    """
    try:
        result = create_call_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de llamadas: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/return-example")
def analyze_return_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de return.
    Devuelve un análisis con returns de ejemplo.
    """
    try:
        result = create_return_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de returns: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/while-example")
def analyze_while_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de bucles WHILE.
    Devuelve un análisis con un bucle WHILE de ejemplo.
    """
    try:
        result = create_while_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de bucle WHILE: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/repeat-example")
def analyze_repeat_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar las reglas de bucles REPEAT.
    Devuelve un análisis con un bucle REPEAT de ejemplo.
    """
    try:
        result = create_repeat_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis de bucle REPEAT: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

@router.get("/while-repeat-combined-example")
def analyze_while_repeat_combined_example() -> Dict[str, Any]:
    """
    Endpoint de prueba para verificar la combinación de bucles WHILE con REPEAT.
    Devuelve un análisis que combina WHILE con REPEAT anidado.
    """
    try:
        result = create_while_repeat_combined_analysis()
        return result
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en análisis combinado WHILE-REPEAT: {str(e)}",
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
