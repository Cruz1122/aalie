"""
Servicio de clasificación de algoritmos.
"""
from typing import Dict, Any
from .classifier import detect_algorithm_kind
from ..parsing.service import parse_source


def classify_algorithm(source: str = None, ast: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Clasifica un algoritmo como iterative, recursive, hybrid o unknown.
    
    Args:
        source: Código fuente a parsear y clasificar (opcional)
        ast: AST ya parseado a clasificar (opcional)
        
    Returns:
        Diccionario con ok, kind, method, errors
    """
    try:
        # Determinar si recibimos source o ast
        if ast is not None:
            # Usar AST directamente
            kind = detect_algorithm_kind(ast)
            return {
                "ok": True,
                "kind": kind,
                "method": "ast"
            }
        elif source is not None:
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
            
            # Clasificar el algoritmo
            kind = detect_algorithm_kind(ast)
            
            return {
                "ok": True,
                "kind": kind,
                "method": "ast"
            }
        else:
            return {
                "ok": False,
                "errors": [{"message": "Se requiere 'source' o 'ast' en el payload"}]
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

