"""
Adaptador para el parser de gramática.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Tuple, Optional, List, Dict, Any

# Intentar usar el parser real si está instalado
try:
    from aa_grammar.api import parse_to_ast  # type: ignore
    GRAMMAR_AVAILABLE = True
except Exception:
    parse_to_ast = None
    GRAMMAR_AVAILABLE = False


def is_grammar_available() -> bool:
    """
    Verifica si el parser de gramática está disponible.
    
    Returns:
        True si el módulo aa_grammar está instalado y disponible, False en caso contrario
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    return GRAMMAR_AVAILABLE


def parse_to_ast_adapter(source: str) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Adaptador para parsear código fuente usando aa_grammar.
    
    Args:
        source: Código fuente a parsear
        
    Returns:
        Tupla (ast, errors) donde:
        - ast: AST parseado o None si hay errores
        - errors: Lista de diccionarios con errores de parsing (cada error tiene line, column, message)
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    if not GRAMMAR_AVAILABLE or parse_to_ast is None:
        return None, [{"line": 0, "column": 0, "message": "aa_grammar no disponible"}]

    # Parsear el código
    ast, raw_errors = parse_to_ast(source)
    return ast, raw_errors

