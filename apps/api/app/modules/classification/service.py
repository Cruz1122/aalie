"""
Servicio de clasificación de algoritmos.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict

from ..parsing.service import parse_source
from .classifier import detect_algorithm_kind


def classify_algorithm(
    source: str = None, ast: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Clasifica un algoritmo a partir de código fuente o de un AST.

    Si se recibe un AST, la clasificación se realiza directamente. Si se
    recibe código fuente, primero se parsea y luego se determina la clase
    del algoritmo.

    Args:
        source: Código fuente que debe parsearse y clasificarse. Es opcional
            cuando ya se proporciona ast.
        ast: Árbol de sintaxis abstracta ya parseado. Es opcional cuando se
            proporciona source.

    Returns:
        Diccionario con el estado de la operación. Cuando la clasificación es
        exitosa incluye ok, kind y method; si ocurre un error, incluye la
        lista errors con el detalle correspondiente.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    try:
        # Determinar si recibimos source o ast
        if ast is not None:
            # Usar AST directamente
            kind = detect_algorithm_kind(ast)
            return {"ok": True, "kind": kind, "method": "ast"}
        elif source is not None:
            if not isinstance(source, str):
                return {
                    "ok": False,
                    "errors": [
                        {"message": "El campo 'source' debe ser una cadena de texto"}
                    ],
                }

            # Parsear el código fuente
            parse_result = parse_source(source)
            if not parse_result.get("ok", False):
                return {"ok": False, "errors": parse_result.get("errors", [])}

            ast = parse_result.get("ast")
            if not ast:
                return {
                    "ok": False,
                    "errors": [{"message": "No se pudo obtener el AST del código"}],
                }

            # Clasificar el algoritmo
            kind = detect_algorithm_kind(ast)

            return {"ok": True, "kind": kind, "method": "ast"}
        else:
            return {
                "ok": False,
                "errors": [{"message": "Se requiere 'source' o 'ast' en el payload"}],
            }

    except Exception as e:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error en clasificación: {str(e)}",
                    "line": None,
                    "column": None,
                }
            ],
        }
