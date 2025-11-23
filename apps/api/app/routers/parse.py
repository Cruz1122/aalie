from fastapi import APIRouter, Body
from typing import Any, Dict

router = APIRouter(prefix="/grammar", tags=["grammar"])

# Intentar usar el parser real si está instalado
try:
    from aa_grammar.api import parse_to_ast  # type: ignore
    GRAMMAR_AVAILABLE = True
except Exception:
    parse_to_ast = None
    GRAMMAR_AVAILABLE = False

def parse_source(source: str) -> Dict[str, Any]:
    """
    Función auxiliar para parsear código fuente y devolver AST o errores.
    
    Args:
        source: Código fuente a parsear
        
    Returns:
        Diccionario con ok, ast, errors
    """
    if not GRAMMAR_AVAILABLE or parse_to_ast is None:
        return {
            "ok": False,
            "ast": None,
            "errors": [{"line": 0, "column": 0, "message": "aa_grammar no disponible"}],
        }

    # Parsear el código
    ast, raw_errors = parse_to_ast(source)
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

@router.post("/parse")
def parse(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Parsea pseudocódigo y devuelve AST o errores.
    
    Body compat:
      { "input": string }  o  { "source": string }
    Respuesta compat con el frontend:
      { ok, available, runtime, error?, ast?, errors? }
    """
    # Extraer source de input o source para compatibilidad
    source = str(payload.get("input") or payload.get("source") or "")

    # Usar la función parse_source
    result = parse_source(source)
    
    # Agregar campos adicionales para compatibilidad con el frontend
    return {
        "ok": result["ok"],
        "available": GRAMMAR_AVAILABLE,
        "runtime": "python",
        "error": result["errors"][0]["message"] if result["errors"] else None,
        "ast": result["ast"],
        "errors": result["errors"],
    }
