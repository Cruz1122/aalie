"""
Servicio de parsing.
"""
from typing import Dict, Any
from .adapter import parse_to_ast_adapter, is_grammar_available


def parse_source(source: str) -> Dict[str, Any]:
    """
    Función auxiliar para parsear código fuente y devolver AST o errores.
    
    Args:
        source: Código fuente a parsear
        
    Returns:
        Diccionario con ok, ast, errors
    """
    if not is_grammar_available():
        return {
            "ok": False,
            "ast": None,
            "errors": [{"line": 0, "column": 0, "message": "aa_grammar no disponible"}],
        }

    # Parsear el código
    ast, raw_errors = parse_to_ast_adapter(source)
    ok = len(raw_errors) == 0
    
    # Convertir errores al formato estándar
    errors_list = [
        {
            "line": e.get("line", 0),
            "column": e.get("column", 0),
            "message": e.get("message", "error de sintaxis")
        }
        for e in raw_errors
    ]
    
    return {
        "ok": ok,
        "ast": ast if ok else None,
        "errors": errors_list,
    }

