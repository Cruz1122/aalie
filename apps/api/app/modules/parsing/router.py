"""
Router para el módulo de parsing.
"""
from fastapi import APIRouter, Body
from typing import Any, Dict
from .service import parse_source
from .adapter import is_grammar_available

router = APIRouter(prefix="/grammar", tags=["grammar"])


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
        "available": is_grammar_available(),
        "runtime": "python",
        "error": result["errors"][0]["message"] if result["errors"] else None,
        "ast": result["ast"],
        "errors": result["errors"],
    }

