from fastapi import APIRouter, Body
from typing import Any, Dict

from ..analysis.algorithm_classifier import detect_algorithm_kind
from ..routers.parse import parse_source

router = APIRouter(prefix="/classify", tags=["classify"])


@router.post("")
def classify(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Clasifica un algoritmo como iterative, recursive, hybrid o unknown.
    
    Acepta dos formatos de entrada:
    - {"source": str}: Código fuente a parsear y clasificar
    - {"ast": Dict[str, Any]}: AST ya parseado a clasificar
    
    Returns:
        {
            "ok": bool,
            "kind": "iterative" | "recursive" | "hybrid" | "unknown",
            "method": "ast",
            "errors"?: List[Dict]  # Solo si ok=False
        }
    """
    try:
        ast = None
        
        # Determinar si recibimos source o ast
        if "ast" in payload:
            ast = payload["ast"]
        elif "source" in payload:
            source = payload["source"]
            if not isinstance(source, str):
                return {
                    "ok": False,
                    "errors": [{"message": "El campo 'source' debe ser una cadena de texto"}]
                }
            
            # Parsear el código fuente
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
                    "errors": [{"message": "No se pudo obtener el AST del código"}]
                }
        else:
            return {
                "ok": False,
                "errors": [{"message": "Se requiere 'source' o 'ast' en el payload"}]
            }
        
        # Clasificar el algoritmo
        kind = detect_algorithm_kind(ast)
        
        return {
            "ok": True,
            "kind": kind,
            "method": "ast"
        }
        
    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en clasificación: {str(e)}",
                    "line": None,
                    "column": None
                }
            ]
        }

