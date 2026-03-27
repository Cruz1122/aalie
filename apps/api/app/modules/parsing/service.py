"""
Servicio de parsing.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict

from .adapter import is_grammar_available, parse_to_ast_adapter


def normalize_source_text(source: str) -> str:
    """
    Normaliza texto fuente para evitar diferencias entre pegado manual e importación desde archivo.

    - Elimina BOM UTF-8 al inicio
    - Normaliza saltos de línea a LF
    """
    normalized = str(source or "")
    if normalized.startswith("\ufeff"):
        normalized = normalized[1:]
    return normalized.replace("\r\n", "\n").replace("\r", "\n")


def parse_source(source: str) -> Dict[str, Any]:
    """
    Función auxiliar para parsear código fuente y devolver AST o errores.
    
    Args:
        source: Código fuente a parsear
        
    Returns:
        Diccionario con ok (bool), ast (opcional) y errors (lista)
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    if not is_grammar_available():
        return {
            "ok": False,
            "ast": None,
            "errors": [{"line": 0, "column": 0, "message": "aa_grammar no disponible"}],
        }

    # Parsear el código normalizado
    normalized_source = normalize_source_text(source)
    ast, raw_errors = parse_to_ast_adapter(normalized_source)
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

